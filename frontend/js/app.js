import { $, $$, toast, setLoading } from "./ui.js";
import { requireLogin, verifySession, refreshQuotaBadge, getUser, logout, showCachedQuotaBadge, redirectIfWrongAppPage, syncUserDisplay } from "./auth.js";
import { analyzeImage, confirmAnalysis } from "./analyze.js";
import { loadCities, quoteShipping } from "./shipping.js";
import { citySelect } from "./city-select.js";
import {
  renderAnalysisForm,
  renderSources,
  renderShippingOptions,
} from "./render.js";
import { initConsultant } from "./consultant.js?v=2";
import { initServices, onCourierViewOpen } from "./services-ui.js";
import { initHistory } from "./history.js";
import { initMovingWizard } from "./moving-wizard.js";
import { initTopluKargo } from "./toplu-kargo.js";

if (!requireLogin()) throw new Error("yonlendiriliyor");

if (redirectIfWrongAppPage(getUser())) throw new Error("yonlendiriliyor");

showCachedQuotaBadge();

if ("requestIdleCallback" in window) {
  requestIdleCallback(() => initConsultant(), { timeout: 2500 });
} else {
  setTimeout(() => initConsultant(), 1500);
}

const VIEWS = ["dashboard", "wizard", "courier", "tracking", "warehouse", "heavy", "nakliyat", "toplu-kargo"];

const state = {
  file: null,
  analysisId: null,
  analysis: null,
  sources: [],
  readSpecs: null,
  confirmedSpecs: null,
};

syncUserDisplay(getUser());

verifySession().then(() => {
  if (redirectIfWrongAppPage(getUser())) return;
  syncUserDisplay(getUser());
});
$("#logoutBtn").addEventListener("click", logout);

function showView(name) {
  VIEWS.forEach((v) => {
    const el = $(`#view-${v}`);
    if (!el) return;
    const show = v === name;
    el.classList.toggle("hidden", !show);
    if (show) {
      el.classList.remove("view-enter");
      void el.offsetWidth;
      el.classList.add("view-enter");
    } else {
      el.classList.remove("view-enter");
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboard() {
  showView("dashboard");
}

function showWizard() {
  showView("wizard");
  goStep(1);
}

const SERVICE_VIEWS = {
  "ai-analiz": showWizard,
  "sehir-ici": () => { showView("courier"); onCourierViewOpen(); },
  "kargo-takip": () => showView("tracking"),
  "depo-kiralama": () => showView("warehouse"),
  "agir-kargo": () => showView("heavy"),
  "nakliyat": () => {
    showView("nakliyat");
    const c = $("#movingWizardContainer");
    if (c) initMovingWizard(c, () => showView("dashboard"));
  },
  "toplu-kargo": () => {
    showView("toplu-kargo");
    const c = $("#topluContainer");
    if (c) initTopluKargo(c, () => showView("dashboard"));
  },
};

$$("[data-service]").forEach((card) => {
  card.addEventListener("click", () => {
    const service = card.dataset.service;
    if (SERVICE_VIEWS[service]) {
      SERVICE_VIEWS[service]();
      return;
    }
    if (card.classList.contains("soon")) {
      toast("Toplu kargo gönderimi yakında aktif olacak.", "warn");
    }
  });
});

$$(".svc-back, #backToDashboard, #mvBackToDash").forEach((btn) => {
  btn.addEventListener("click", showDashboard);
});

function loadCityDatalists() {
  loadCities()
    .then((res) => {
      const cities = (res.cities || []).map(c => c.charAt(0).toUpperCase() + c.slice(1));

      // Custom selects for main shipping form and heavy cargo
      [
        "origin", "destination",
        "heavyOrigin", "heavyDestination",
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) citySelect(el, { cities });
      });

      // Fallback datalists for other places
      ["cityList", "cityListCourier", "cityListHeavy"].forEach((id) => {
        const dl = document.getElementById(id);
        if (!dl) return;
        dl.innerHTML = "";
        cities.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c;
          dl.append(opt);
        });
      });
    })
    .catch(() => {});
}

initServices({ showDashboard, loadCityDatalists });
initHistory();
loadCityDatalists();

function goStep(n) {
  $$(".step").forEach((s) => {
    const step = Number(s.dataset.step);
    s.classList.toggle("active", step === n);
    s.classList.toggle("done", step < n);
  });
  $$(".wizard-pro-step").forEach((s) => {
    const step = Number(s.dataset.step);
    s.classList.toggle("active", step === n);
    s.classList.toggle("done", step < n);
  });
  [1, 2, 3].forEach((i) => $(`#view-${i}`).classList.toggle("hidden", i !== n));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ADIM 1 */
const dropzone = $("#dropzone");
const fileInput = $("#fileInput");

dropzone.addEventListener("click", () => fileInput.click());
document.querySelector(".upload-select-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drag"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag");
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith("image/")) return toast("Lütfen bir görsel dosyası seçin.", "err");
  if (file.size > 8 * 1024 * 1024) return toast("Dosya 8 MB'tan buyuk olamaz.", "err");
  state.file = file;
  $("#previewImg").src = URL.createObjectURL(file);
  $("#preview").classList.remove("hidden");
  dropzone.classList.add("hidden");
}

$("#resetUpload").addEventListener("click", resetUpload);
function resetUpload() {
  state.file = null;
  fileInput.value = "";
  $("#preview").classList.add("hidden");
  dropzone.classList.remove("hidden");
}

$("#analyzeBtn").addEventListener("click", async (e) => {
  if (!state.file) return;
  const btn = e.currentTarget;
  setLoading(btn, true);
  try {
    const res = await analyzeImage(state.file, $("#hint").value.trim());
    state.analysisId = res.analysisId;
    state.analysis = res.analysis;
    state.sources = res.sources || [];
    const a = res.analysis;
    const failed = !a?.product_name && !a?.weight_kg && (a?.confidence === 0 || a?.notes?.includes("hata"));
    state.readSpecs = renderAnalysisForm($("#analysisResult"), res.analysis);
    renderSources($("#sourcesBox"), state.sources);
    goStep(2);
    refreshQuotaBadge();
    if (failed) toast(a?.notes || "AI analizi başarısız.", "err", 8000);
  } catch (err) {
    toast(err.message, "err", 8000);
  } finally {
    setLoading(btn, false);
  }
});

$("#backTo1").addEventListener("click", () => goStep(1));

$("#confirmBtn").addEventListener("click", async (e) => {
  const specs = state.readSpecs ? state.readSpecs() : {};
  if (!specs.weight_kg || Number(specs.weight_kg) <= 0) {
    return toast("Devam etmek için geçerli bir ağırlık (kg) girin.", "err");
  }
  state.confirmedSpecs = specs;
  const btn = e.currentTarget;
  setLoading(btn, true);
  try {
    if (state.analysisId) await confirmAnalysis(state.analysisId, specs).catch(() => {});
    goStep(3);
  } finally {
    setLoading(btn, false);
  }
});

$("#backTo2").addEventListener("click", () => goStep(2));

$("#quoteBtn").addEventListener("click", async (e) => {
  const specs = state.confirmedSpecs;
  if (!specs) return toast("Önce ürün bilgilerini onaylayın.", "err");
  const btn = e.currentTarget;
  setLoading(btn, true);
  try {
    const result = await quoteShipping({
      weightKg: Number(specs.weight_kg),
      lengthCm: specs.length_cm,
      widthCm: specs.width_cm,
      heightCm: specs.height_cm,
      origin: $("#origin").value.trim(),
      destination: $("#destination").value.trim(),
      distanceKm: $("#distance").value,
      analysisId: state.analysisId,
    });
    renderShippingOptions($("#shippingResult"), result);
    $("#restartActions").style.display = "flex";
    refreshQuotaBadge();
    toast("Firma fiyatları hazır!", "ok");
  } catch (err) {
    toast(err.message, "err", 6000);
  } finally {
    setLoading(btn, false);
  }
});

function resetWizard() {
  state.file = null;
  state.analysisId = null;
  state.analysis = null;
  state.confirmedSpecs = null;
  resetUpload();
  $("#shippingResult").innerHTML = "";
  $("#restartActions").style.display = "none";
  $("#analysisResult").innerHTML = "";
  $("#sourcesBox").innerHTML = "";
  $("#hint").value = "";
  $("#origin").value = "";
  $("#destination").value = "";
  $("#distance").value = "";
}

$("#restartBtn").addEventListener("click", () => {
  resetWizard();
  showDashboard();
});

/* Manuel / fotograf modu */
$$(".wizard-mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.wmode;
    $$(".wizard-mode-tab").forEach((t) => t.classList.toggle("active", t === tab));
    $("#manualPanel")?.classList.toggle("hidden", mode !== "manual");
    $("#photoPanel")?.classList.toggle("hidden", mode !== "photo");
  });
});

$("#manualContinueBtn")?.addEventListener("click", () => {
  const product = $("#m_product")?.value.trim();
  const weight = Number($("#m_weight")?.value);
  const length = Number($("#m_len")?.value) || 30;
  const width = Number($("#m_wid")?.value) || 20;
  const height = Number($("#m_hei")?.value) || 15;
  if (!product) return toast("Ürün adı girin.", "err");
  if (!weight || weight <= 0) return toast("Geçerli ağırlık (kg) girin.", "err");

  state.analysisId = null;
  state.analysis = {
    product_name: product,
    brand: "",
    model: "",
    weight_kg: weight,
    length_cm: length,
    width_cm: width,
    height_cm: height,
    confidence: 1,
    manual: true,
  };
  state.readSpecs = renderAnalysisForm($("#analysisResult"), state.analysis);
  $("#sourcesBox").innerHTML = "";
  goStep(2);
  toast("Manuel bilgiler kaydedildi — onaylayıp devam edin.", "ok");
});
