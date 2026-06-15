import { $, $$, toast, setLoading } from "./ui.js";
import { initCourierMap, openCourierView } from "./courier-map.js";
import { loadHeavyCatalog, quoteHeavy } from "./heavy.js";
import { refreshQuotaBadge } from "./auth.js";
import {
  renderHeavyOptions,
  renderHeavyRequirements,
} from "./render-services.js";
import { renderCarrierTrackGrid } from "./carrier-trackers.js";
import { initWarehouseWizard } from "./warehouse-wizard.js";

const heavyState = { catalog: null, cargoType: "general", quote: null };

export function initServices({ showDashboard, loadCityDatalists }) {
  loadCityDatalists?.();
  initCourier();
  initTracking();
  initWarehouse();
  initHeavy();
}

/* ========== SEHIR ICI KURYE ========== */
function initCourier() {
  initCourierMap();
}

export function onCourierViewOpen() {
  openCourierView();
}

/* ========== KARGO TAKIP ========== */
function initTracking() {
  renderCarrierTrackGrid($("#carrierTrackGrid"));
}

/* ========== DEPO KIRALAMA ========== */
function initWarehouse() {
  initWarehouseWizard();
}

/* ========== AGIR YUK KARGO ========== */
function initHeavy() {
  loadHeavyCatalog()
    .then((res) => {
      heavyState.catalog = res;
      renderHeavyTypeGrid();
      applyHeavyTypeDefaults("general");
    })
    .catch(() => {});

  $("#heavyQuoteBtn")?.addEventListener("click", onHeavyQuote);
}

function renderHeavyTypeGrid() {
  const grid = $("#heavyTypeGrid");
  if (!grid || !heavyState.catalog?.cargoTypes) return;
  grid.innerHTML = "";

  heavyState.catalog.cargoTypes.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `heavy-type-card ${heavyState.cargoType === t.id ? "active" : ""}`;
    btn.dataset.type = t.id;
    btn.innerHTML = `
      <span class="heavy-type-emoji">${t.emoji}</span>
      <strong>${t.label}</strong>
      <span class="muted">${t.description}</span>
      <span class="badge">min ${t.minWeightKg} kg</span>
    `;
    btn.addEventListener("click", () => {
      heavyState.cargoType = t.id;
      $$(".heavy-type-card").forEach((c) => c.classList.toggle("active", c.dataset.type === t.id));
      applyHeavyTypeDefaults(t.id);
    });
    grid.append(btn);
  });
}

function applyHeavyTypeDefaults(typeId) {
  const type = heavyState.catalog?.cargoTypes?.find((t) => t.id === typeId);
  if (!type) return;

  $$(".heavy-vehicle-fields").forEach((el) => el.classList.toggle("hidden", !["car", "motorcycle"].includes(typeId)));
  $$(".heavy-car-fields").forEach((el) => el.classList.toggle("hidden", typeId !== "car"));
  $$(".heavy-pallet-fields").forEach((el) => el.classList.toggle("hidden", typeId !== "pallet"));

  if (type.defaultDims) {
    $("#heavyLength").value = type.defaultDims.lengthCm;
    $("#heavyWidth").value = type.defaultDims.widthCm;
    $("#heavyHeight").value = type.defaultDims.heightCm;
  }
  if (type.defaultWeightKg) $("#heavyWeight").value = type.defaultWeightKg;
  else if (typeId === "general") $("#heavyWeight").value = 150;

  renderHeavyRequirements($("#heavyReqBox"), type.requirements, type.allowedModes);
}

function collectHeavyForm() {
  return {
    cargoType: heavyState.cargoType,
    productTitle: $("#heavyProductTitle")?.value.trim(),
    productDescription: $("#heavyProductDesc")?.value.trim(),
    brand: $("#heavyBrand")?.value.trim(),
    model: $("#heavyModel")?.value.trim(),
    year: $("#heavyYear")?.value,
    plate: $("#heavyPlate")?.value.trim(),
    quantity: $("#heavyQuantity")?.value,
    weightKg: Number($("#heavyWeight")?.value),
    lengthCm: Number($("#heavyLength")?.value),
    widthCm: Number($("#heavyWidth")?.value),
    heightCm: Number($("#heavyHeight")?.value),
    isRunning: $("#heavyIsRunning")?.checked,
    fragile: $("#heavyFragile")?.checked,
    needsLoadingHelp: $("#heavyLoadingHelp")?.checked,
    pickupDate: $("#heavyPickupDate")?.value,
    specialNotes: $("#heavyNotes")?.value.trim(),
    origin: $("#heavyOrigin")?.value.trim(),
    destination: $("#heavyDestination")?.value.trim(),
    senderName: $("#heavySenderName")?.value.trim(),
    senderPhone: $("#heavySenderPhone")?.value.trim(),
    recipientName: $("#heavyRecipientName")?.value.trim(),
    recipientPhone: $("#heavyRecipientPhone")?.value.trim(),
  };
}

async function onHeavyQuote(e) {
  const btn = e.currentTarget;
  setLoading(btn, true);
  try {
    const res = await quoteHeavy(collectHeavyForm());
    heavyState.quote = res;
    renderHeavyOptions($("#heavyQuoteResult"), res);
    refreshQuotaBadge();
    toast("Firma fiyatları hazır!", "ok");
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Tasima Teklifi Al");
  }
}
