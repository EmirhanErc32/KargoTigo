import { $, $$, toast, setLoading, fmtMoney } from "./ui.js";
import { findNearestWarehouse, quoteWarehouse, bookWarehouse, payWarehouse, reverseGeocodeWarehouse } from "./warehouse.js";
import { refreshHistoryIfOpen } from "./history.js";
import { downloadInvoicePdf as saveInvoicePdf, viewInvoiceHtml } from "./invoice-pdf.js";

const state = {
  step: 1,
  lat: null,
  lng: null,
  address: "",
  warehouse: null,
  warehouseOptions: [],
  pricing: null,
  booking: null,
  invoiceHtml: null,
};

const DISTRICT_COORDS = {
  kadikoy: [40.9927, 29.0277], besiktas: [41.0422, 29.0089], sisli: [41.0602, 28.9877],
  bakirkoy: [40.978, 28.872], esenyurt: [41.029, 28.679], umraniye: [41.016, 29.124],
  kartal: [40.906, 29.172], pendik: [40.877, 29.234], tuzla: [40.817, 29.3],
  basaksehir: [41.093, 28.802], beylikduzu: [41.002, 28.642], avcilar: [40.979, 28.72],
  bagcilar: [41.039, 28.856], gaziosmanpasa: [41.062, 28.912], sariyer: [41.166, 29.05],
  maltepe: [40.935, 29.131], atasehir: [40.992, 29.124], uskudar: [41.023, 29.015],
  fatih: [41.019, 28.949], zeytinburnu: [41.003, 28.907], bayrampasa: [41.045, 28.904],
  sultangazi: [41.106, 28.868], kagithane: [41.079, 28.975], eyupsultan: [41.048, 28.934],
  cekmekoy: [41.032, 29.178], sultanbeyli: [40.961, 29.264], kucukcekmece: [41.0, 28.774],
  buyukcekmece: [41.02, 28.585], silivri: [41.073, 28.246], arnavutkoy: [41.184, 28.74],
  istanbul: [41.0082, 28.9784],
};

export function initWarehouseWizard() {
  bindEvents();
  goStep(1);
}

function bindEvents() {
  $("#whUseGps")?.addEventListener("click", useGps);
  $("#whToStep2")?.addEventListener("click", onFindNearest);
  $("#whBack1")?.addEventListener("click", () => goStep(1));
  $("#whToStep3")?.addEventListener("click", () => goStep(3));
  $("#whBack2")?.addEventListener("click", () => goStep(2));
  $("#whToStep4")?.addEventListener("click", onSubmitBooking);
  $("#whBack3")?.addEventListener("click", () => goStep(3));
  $("#whPayBtn")?.addEventListener("click", onPay);
  $("#whDownloadInvoice")?.addEventListener("click", downloadInvoicePdf);
  $("#whViewInvoice")?.addEventListener("click", viewInvoice);

  // Kart numarası: 4er 4er gruplama (max 19 karakter: "0000 0000 0000 0000")
  const whCardNo = $("#whCardNo");
  if (whCardNo) {
    whCardNo.addEventListener("input", () => {
      let v = whCardNo.value.replace(/\D/g, "").slice(0, 16);
      whCardNo.value = v.replace(/(.{4})/g, "$1 ").trim();
    });
  }

  // SKT: ay girince otomatik "/" ekle (AA/YY)
  const whCardExp = $("#whCardExp");
  if (whCardExp) {
    whCardExp.addEventListener("input", () => {
      let v = whCardExp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2);
      whCardExp.value = v;
    });
  }

  // CVV: max 3 rakam
  const whCardCvv = $("#whCardCvv");
  if (whCardCvv) {
    whCardCvv.addEventListener("input", () => {
      whCardCvv.value = whCardCvv.value.replace(/\D/g, "").slice(0, 3);
    });
  }
  $("#whReset")?.addEventListener("click", resetWizard);
}

function goStep(n) {
  state.step = n;
  $$(".wh-step-panel").forEach((p) => p.classList.add("hidden"));
  $(`#whStep${n}`)?.classList.remove("hidden");
  $$(".wh-step").forEach((s) => {
    const sn = Number(s.dataset.step);
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
  });
}

function resolveLocation() {
  const lat = Number($("#whManualLat")?.value);
  const lng = Number($("#whManualLng")?.value);
  if (lat && lng) {
    state.lat = lat;
    state.lng = lng;
    state.address = $("#whManualAddress")?.value.trim() || "Manuel konum";
    return true;
  }
  const addr = ($("#whManualAddress")?.value || "").toLowerCase();
  for (const [key, [la, ln]] of Object.entries(DISTRICT_COORDS)) {
    if (addr.includes(key)) {
      state.lat = la;
      state.lng = ln;
      state.address = $("#whManualAddress")?.value.trim();
      return true;
    }
  }
  if (state.lat != null && state.lng != null) return true;
  return false;
}

function nearestDistrictName(lat, lng) {
  let best = null;
  let bestKm = Infinity;
  for (const [name, [la, ln]] of Object.entries(DISTRICT_COORDS)) {
    if (name === "istanbul") continue;
    const d = haversineKm(lat, lng, la, ln);
    if (d < bestKm) {
      bestKm = d;
      best = name;
    }
  }
  if (!best) return "İstanbul";
  return best.charAt(0).toUpperCase() + best.slice(1);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fillAddressFromCoords(lat, lng) {
  try {
    const res = await reverseGeocodeWarehouse(lat, lng);
    if (res.address) return res.address;
    if (res.district) return `${res.district}, ${res.city || "İstanbul"}`;
  } catch {
    /* fallback asagida */
  }
  const district = nearestDistrictName(lat, lng);
  return `${district}, İstanbul`;
}

async function useGps() {
  const status = $("#whLocationStatus");
  const btn = $("#whUseGps");
  if (!navigator.geolocation) {
    toast("Tarayiciniz konum desteklemiyor.", "err");
    return;
  }
  status.textContent = "Konum aliniyor...";
  status.classList.remove("ok");
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      state.lat = lat;
      state.lng = lng;

      $("#whManualLat").value = lat.toFixed(6);
      $("#whManualLng").value = lng.toFixed(6);

      status.textContent = "Adres cozuluyor...";
      try {
        const address = await fillAddressFromCoords(lat, lng);
        state.address = address;
        $("#whManualAddress").value = address;
        status.textContent = `✓ Konum alindi: ${address}`;
        status.classList.add("ok");
      } catch {
        const fallback = `${nearestDistrictName(lat, lng)}, İstanbul`;
        state.address = fallback;
        $("#whManualAddress").value = fallback;
        status.textContent = `✓ Konum alindi: ${fallback}`;
        status.classList.add("ok");
      } finally {
        btn.disabled = false;
      }
    },
    () => {
      status.textContent = "Konum alinamadi. Manuel girin.";
      toast("Konum izni verilmedi.", "err");
      btn.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function validateProduct() {
  const w = Number($("#whWeight")?.value);
  const l = Number($("#whLength")?.value);
  const wi = Number($("#whWidth")?.value);
  const h = Number($("#whHeight")?.value);
  if (!w || !l || !wi || !h) {
    toast("Lütfen ürün ölçülerini girin veya AI ile analiz edin.", "err");
    return false;
  }
  if (w > 100) {
    toast("Maksimum ağırlık 100 kg'dir.", "err");
    return false;
  }
  return true;
}

function collectProduct() {
  return {
    weightKg: Number($("#whWeight")?.value),
    lengthCm: Number($("#whLength")?.value),
    widthCm: Number($("#whWidth")?.value),
    heightCm: Number($("#whHeight")?.value),
    storageDays: Number($("#whStorageDays")?.value) || 30,
  };
}

async function onFindNearest() {
  if (!resolveLocation()) {
    toast("Once konumunuzu girin veya GPS kullanin.", "err");
    return;
  }
  if (!validateProduct()) return;
  const btn = $("#whToStep2");
  setLoading(btn, true);
  try {
    const nearestRes = await findNearestWarehouse({ lat: state.lat, lng: state.lng });
    state.warehouseOptions = [nearestRes.nearest, ...(nearestRes.alternatives || [])];
    state.warehouse = nearestRes.nearest;

    await refreshQuote();
    goStep(2);
  } catch (err) {
    toast(err.message || "Depo bulunamadı.", "err");
  } finally {
    setLoading(btn, false, "En Yakin Depoyu Bul →");
  }
}

async function refreshQuote() {
  const product = collectProduct();
  const quoteRes = await quoteWarehouse({
    warehouseId: state.warehouse.id,
    userLat: state.lat,
    userLng: state.lng,
    ...product,
  });
  state.pricing = quoteRes.pricing;
  renderNearestCard();
  renderPricing(state.pricing);
}

async function switchWarehouse(warehouse) {
  if (!warehouse || warehouse.id === state.warehouse?.id) return;
  state.warehouse = warehouse;
  try {
    await refreshQuote();
    toast(`${warehouse.district} deposu secildi.`, "ok");
  } catch (err) {
    toast(err.message, "err");
  }
}

function renderNearestCard() {
  const wh = state.warehouse;
  const alts = state.warehouseOptions.filter((w) => w.id !== wh.id);
  const typeLabel = { standard: "Standart", cold: "Soguk Zincir", fulfillment: "Fulfillment", bonded: "Antrepo" };
  const isNearest = state.warehouseOptions[0]?.id === wh.id;
  const card = $("#whNearestCard");
  if (!card || !wh) return;

  card.innerHTML = `
    ${isNearest ? `<div class="wh-nearest-badge">En Yakin Depo</div>` : `<div class="wh-nearest-badge wh-nearest-badge-alt">Secili Depo</div>`}
    <h3 class="wh-nearest-name">${wh.name}</h3>
    <p class="muted">${wh.district} · ${wh.address}</p>
    <div class="wh-nearest-stats">
      <span>📍 ${wh.distanceKm} km</span>
      <span class="badge">${typeLabel[wh.type] || wh.type}</span>
      <span>${wh.available_sqm} m² bos</span>
    </div>
    ${alts.length ? `
      <p class="muted wh-alt-title">Alternatif depolar</p>
      <div class="wh-alt-grid" id="whAltGrid"></div>
    ` : ""}
  `;

  const grid = $("#whAltGrid");
  if (grid) {
    alts.forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wh-alt-btn";
      btn.innerHTML = `
        <strong>${a.district}</strong>
        <span>${a.distanceKm} km · ${typeLabel[a.type] || a.type}</span>
      `;
      btn.addEventListener("click", () => switchWarehouse(a));
      grid.append(btn);
    });
  }
}

function renderPricing(p) {
  const el = $("#whPricingBreakdown");
  if (!el || !p) return;
  el.innerHTML = `
    <div class="wh-price-row"><span>Gerekli alan</span><strong>${p.areaSqm} m²</strong></div>
    <div class="wh-price-row"><span>Hacim</span><strong>${p.volumeM3} m³</strong></div>
    <div class="wh-price-row"><span>Agirlik</span><strong>${p.weightKg} kg</strong></div>
    <div class="wh-price-row"><span>Depolama (${p.storageDays} gun)</span><strong>${fmtMoney(p.storageSubtotal)}</strong></div>
    <div class="wh-price-row sub"><span>Gunluk depolama</span><span>${fmtMoney(p.dailyStorageTotal)}/gun</span></div>
    <p class="muted wh-price-note">Teslimat musteri tarafindan yapilir — tasima ucreti yoktur.</p>
    <div class="wh-price-row"><span>Ara Toplam</span><strong>${fmtMoney(p.subtotal)}</strong></div>
    <div class="wh-price-row"><span>KDV (%20)</span><strong>${fmtMoney(p.kdv)}</strong></div>
    <div class="wh-price-row total"><span>Genel Toplam</span><strong>${fmtMoney(p.totalPrice)}</strong></div>
  `;
}

async function onSubmitBooking() {
  const firstName = $("#whFirstName")?.value.trim();
  const lastName = $("#whLastName")?.value.trim();
  const tcNo = $("#whTcNo")?.value.trim();
  const phone = $("#whPhone")?.value.trim();
  const email = $("#whEmail")?.value.trim();
  const personalAddress = $("#whPersonalAddress")?.value.trim();

  if (!firstName || !lastName) return toast("Ad soyad girin.", "err");
  if (!tcNo || tcNo.length !== 11) return toast("Gecerli TC kimlik no girin.", "err");
  if (!phone) return toast("Telefon girin.", "err");
  if (!email) return toast("E-posta girin.", "err");
  if (!personalAddress) return toast("Kisisel adres girin.", "err");

  const btn = $("#whToStep4");
  setLoading(btn, true);
  try {
    const product = collectProduct();
    const res = await bookWarehouse({
      warehouseId: state.warehouse.id,
      userLat: state.lat,
      userLng: state.lng,
      userAddress: state.address,
      productPhoto: state.productPhoto,
      firstName,
      lastName,
      tcNo,
      phone,
      email,
      personalAddress,
      notes: $("#whNotes")?.value.trim(),
      ...product,
    });
    state.booking = res.booking;
    state.pricing = res.pricing;

    renderPaymentSummary(res.pricing);
    goStep(4);
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ödemeye Geç →");
  }
}

function renderPaymentSummary(p) {
  const el = $("#whPaymentSummary");
  if (!el) return;
  el.innerHTML = `
    <div class="payment-row"><span>Depolama (${p.storageDays} gun)</span><span>${fmtMoney(p.storageSubtotal)}</span></div>
    <div class="payment-row"><span>KDV</span><span>${fmtMoney(p.kdv)}</span></div>
    <div class="payment-row total"><span>Toplam</span><span>${fmtMoney(p.totalPrice)}</span></div>
  `;
}

/** "AA/YY" formatindaki son kullanma tarihinin gecerli (gecmemis) olup olmadigini dener. */
function isValidCardExpiry(exp) {
  const m = String(exp).match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  // Kart, son kullanma ayinin sonuna kadar gecerlidir
  const expiryEnd = new Date(year, month, 1);
  return now < expiryEnd;
}

async function onPay() {
  const btn = $("#whPayBtn");

  const cardNo  = $("#whCardNo")?.value.replace(/\s/g, "") || "";
  const cardExp = $("#whCardExp")?.value.trim() || "";
  const cardCvv = $("#whCardCvv")?.value.trim() || "";
  const cardName = $("#whCardName")?.value.trim() || "";

  if (!cardName)          { toast("Kart üzerindeki ismi girin.", "err"); return; }
  if (cardNo.length < 16) { toast("Geçerli bir kart numarası girin (16 hane).", "err"); return; }
  if (cardExp.length < 5) { toast("Son kullanma tarihini girin (AA/YY).", "err"); return; }
  if (!isValidCardExpiry(cardExp)) { toast("Kartın son kullanma tarihi geçmiş veya geçersiz.", "err"); return; }
  if (cardCvv.length < 3) { toast("CVV 3 haneli olmalıdır.", "err"); return; }

  setLoading(btn, true);
  try {
    const res = await payWarehouse(state.booking.id);
    state.booking = res.booking;
    state.invoiceHtml = res.invoiceHtml;

    $("#whEntryPassword").textContent = res.booking.entry_password;
    $("#whExitPassword").textContent = res.booking.exit_password;
    $("#whInvoiceNo").textContent = res.booking.invoice_no;

    goStep(5);
    toast("Ödeme başarılı!", "ok");
    refreshHistoryIfOpen();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ödemeyi Tamamla");
  }
}

function viewInvoice() {
  if (!state.invoiceHtml) return toast("Fatura bulunamadı.", "err");
  viewInvoiceHtml(state.invoiceHtml);
}

async function downloadInvoicePdf() {
  if (!state.invoiceHtml) return toast("Fatura bulunamadı.", "err");
  try {
    await saveInvoicePdf(state.invoiceHtml, state.booking?.invoice_no || "fatura");
  } catch (err) {
    toast(err.message, "err");
  }
}

function resetWizard() {
  Object.assign(state, {
    step: 1, lat: null, lng: null, address: "",
    warehouse: null, warehouseOptions: [], pricing: null, booking: null, invoiceHtml: null,
  });
  $("#whWeight").value = "";
  $("#whLength").value = "";
  $("#whWidth").value = "";
  $("#whHeight").value = "";
  $("#whStorageDays").value = "30";
  $("#whManualAddress").value = "";
  $("#whManualLat").value = "";
  $("#whManualLng").value = "";
  $("#whLocationStatus").textContent = "";
  $("#whLocationStatus")?.classList.remove("ok");
  goStep(1);
}

export function openWarehouseView() {
  resetWizard();
}
