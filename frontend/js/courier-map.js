import { $, toast, setLoading, fmtMoney } from "./ui.js";
import {
  loadCourierPoints,
  quoteCourier,
  checkoutCourier,
  payCourier,
  verifyDeliveryCode,
} from "./courier.js";

const state = {
  points: [],
  limits: null,
  pickupId: null,
  deliveryId: null,
  quote: null,
  orderId: null,
  route: [],
  map: null,
  markers: {},
  riderMarker: null,
  routeLine: null,
  animTimer: null,
  mode: "pickup",
};

let leafletLoaded = false;

export function initCourierMap() {
  bindFlowButtons();
  $("#courierToForm")?.addEventListener("click", goToForm);
  $("#courierToPayment")?.addEventListener("click", goToPayment);
  $("#courierPayBtn")?.addEventListener("click", processPayment);
  $("#courierVerifyPickup")?.addEventListener("click", () => verifyCode("pickup"));
  $("#courierVerifyDelivery")?.addEventListener("click", () => verifyCode("delivery"));
  $("#courierReset")?.addEventListener("click", resetCourierFlow);
  $("#courierClearSelection")?.addEventListener("click", clearSelections);
  $("#courierBackToMap")?.addEventListener("click", () => showCourierStep(1));

  // Gönderi Sorgula toggle
  $("#courierQueryToggle")?.addEventListener("click", toggleQueryPanel);
  $("#courierQueryBtn")?.addEventListener("click", doQuery);
  $("#courierQueryInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") doQuery();
  });
}

export async function openCourierView() {
  await ensureMap();
  if (!state.points.length) await loadPoints();
  resetCourierFlow(false);
}

async function ensureMap() {
  if (state.map) return;
  await loadLeaflet();
  await loadPoints();

  const mapEl = document.getElementById("courierMap");
  if (!mapEl || state.map) return;

  state.map = L.map("courierMap", { zoomControl: true }).setView([41.02, 28.97], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 18,
  }).addTo(state.map);

  state.points.forEach((p, i) => {
    const icon = L.divIcon({
      className: "",
      html: `<div class="courier-marker hub" title="${p.name}">${i + 1}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const m = L.marker([p.lat, p.lng], { icon })
      .addTo(state.map)
      .bindPopup(`<strong>${p.name}</strong><br>${p.district}<br><small>${p.address}</small><br><button type="button" class="btn btn-sm btn-primary" style="margin-top:8px;font-size:11px" onclick="window._courierPick('${p.id}')">Sec</button>`);
    state.markers[p.id] = m;
  });

  window._courierPick = (id) => selectPoint(id);

  setTimeout(() => state.map?.invalidateSize(), 300);
}

async function loadLeaflet() {
  if (leafletLoaded || window.L) {
    leafletLoaded = true;
    return;
  }
  await new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => { leafletLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadPoints() {
  const res = await loadCourierPoints();
  state.points = res.points || [];
  state.limits = res.limits || {};
  const lim = $("#courierLimitsText");
  if (lim && state.limits.maxDistanceKm) {
    lim.innerHTML = `Max <strong>${state.limits.maxDistanceKm} km</strong> · 
      Agirlik <strong>${state.limits.maxWeightKg} kg</strong> · 
      Hacim <strong>${state.limits.bucketReference}</strong>`;
  }
}

function selectPoint(id) {
  const p = state.points.find((x) => x.id === id);
  if (!p) return;

  if (!state.pickupId || (state.pickupId && state.deliveryId)) {
    state.pickupId = id;
    state.deliveryId = null;
    state.mode = "delivery";
    updatePointUI();
    toast(`Alim: ${p.name}`, "ok");
    return;
  }

  if (id === state.pickupId) return toast("Farkli bir teslim noktasi secin.", "err");
  state.deliveryId = id;
  state.mode = "pickup";
  updatePointUI();
  toast(`Teslim: ${p.name}`, "ok");
  refreshRoute();
}

function clearSelections() {
  state.pickupId = null;
  state.deliveryId = null;
  state.quote = null;
  state.mode = "pickup";
  clearRoute();
  highlightMarkers();
  updatePointUI();
  if (state.map) state.map.setView([41.02, 28.97], 11);
  toast("Secimler kaldirildi.", "ok");
}

function updatePointUI() {
  const pickup = state.points.find((p) => p.id === state.pickupId);
  const delivery = state.points.find((p) => p.id === state.deliveryId);

  const clearBtn = $("#courierClearSelection");
  if (clearBtn) {
    clearBtn.classList.toggle("hidden", !state.pickupId && !state.deliveryId);
  }

  const pu = $("#courierPickupLabel");
  const dl = $("#courierDeliveryLabel");
  if (pu) {
    pu.innerHTML = pickup
      ? `<strong>${pickup.name}</strong><span>${pickup.district}</span>`
      : `<span class="muted">Haritadan alim noktasi secin</span>`;
  }
  if (dl) {
    dl.innerHTML = delivery
      ? `<strong>${delivery.name}</strong><span>${delivery.district}</span>`
      : `<span class="muted">Haritadan teslim noktasi secin</span>`;
  }

  highlightMarkers();
  if (state.pickupId && state.deliveryId) {
    refreshQuote();
  } else {
    clearRoute();
    state.quote = null;
    const distEl = $("#courierDistanceVal");
    if (distEl) {
      distEl.textContent = "—";
      distEl.parentElement?.classList.remove("invalid");
    }
    const btn = $("#courierToForm");
    if (btn) btn.disabled = true;
  }
}

async function refreshQuote() {
  const weight = Number($("#courierWeight")?.value) || 5;
  const lengthCm = Number($("#courierLength")?.value) || 30;
  const widthCm = Number($("#courierWidth")?.value) || 30;
  const heightCm = Number($("#courierHeight")?.value) || 30;

  try {
    const res = await quoteCourier({
      pickupPointId: state.pickupId,
      deliveryPointId: state.deliveryId,
      weightKg: weight,
      lengthCm, widthCm, heightCm,
    });
    state.quote = res;
    const distEl = $("#courierDistanceVal");
    const btn = $("#courierToForm");
    if (distEl) {
      distEl.textContent = `${res.distanceKm} km`;
      distEl.parentElement?.classList.toggle("invalid", res.distanceKm > (state.limits?.maxDistanceKm || 25));
    }
    if (btn) btn.disabled = false;
    refreshRoute();
  } catch (err) {
    state.quote = null;
    $("#courierDistanceVal").textContent = "—";
    $("#courierToForm").disabled = true;
    if (!err.authExpired && err.status !== 401) toast(err.message, "err");
    clearRoute();
  }
}

function refreshRoute() {
  if (!state.map || !state.pickupId || !state.deliveryId) return;
  const pickup = state.points.find((p) => p.id === state.pickupId);
  const delivery = state.points.find((p) => p.id === state.deliveryId);
  if (!pickup || !delivery) return;

  if (state.routeLine) state.map.removeLayer(state.routeLine);
  const latlngs = [
    [pickup.lat, pickup.lng],
    [(pickup.lat + delivery.lat) / 2 + 0.005, (pickup.lng + delivery.lng) / 2],
    [delivery.lat, delivery.lng],
  ];
  state.routeLine = L.polyline(latlngs, { color: "#0d9488", weight: 4, dashArray: "8 6" }).addTo(state.map);
  state.map.fitBounds(state.routeLine.getBounds(), { padding: [40, 40] });
}

function clearRoute() {
  if (state.routeLine && state.map) {
    state.map.removeLayer(state.routeLine);
    state.routeLine = null;
  }
}

function highlightMarkers() {
  Object.entries(state.markers).forEach(([id, m]) => {
    const p = state.points.find((x) => x.id === id);
    if (!p) return;
    let cls = "courier-marker hub";
    if (id === state.pickupId) cls = "courier-marker pickup";
    else if (id === state.deliveryId) cls = "courier-marker delivery";
    const idx = state.points.indexOf(p) + 1;
    m.setIcon(L.divIcon({
      className: "",
      html: `<div class="${cls}">${id === state.pickupId ? "A" : id === state.deliveryId ? "T" : idx}</div>`,
      iconSize: id === state.pickupId || id === state.deliveryId ? [28, 28] : [22, 22],
      iconAnchor: id === state.pickupId || id === state.deliveryId ? [14, 14] : [11, 11],
    }));
  });
}

function showCourierStep(n) {
  [1, 2, 3, 4].forEach((i) => {
    $(`#courierStep${i}`)?.classList.toggle("hidden", i !== n);
    document.querySelector(`.courier-flow-step[data-cstep="${i}"]`)?.classList.toggle("active", i === n);
    document.querySelector(`.courier-flow-step[data-cstep="${i}"]`)?.classList.toggle("done", i < n);
  });
  if (n === 1) setTimeout(() => state.map?.invalidateSize(), 200);
}

function bindFlowButtons() {
  ["courierWeight", "courierLength", "courierWidth", "courierHeight"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      if (state.pickupId && state.deliveryId) refreshQuote();
    });
  });

  // Phone: only digits, max 11
  ["courierSenderPhone", "courierRecipientPhone"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      el.value = el.value.replace(/\D/g, "").slice(0, 11);
    });
  });

  // Card number: groups of 4, max 16 digits
  const cardNo = document.getElementById("courierCardNo");
  if (cardNo) {
    cardNo.addEventListener("input", () => {
      let v = cardNo.value.replace(/\D/g, "").slice(0, 16);
      cardNo.value = v.replace(/(.{4})/g, "$1 ").trim();
    });
  }

  // SKT: auto-slash after 2 digits
  const cardExp = document.getElementById("courierCardExp");
  if (cardExp) {
    cardExp.addEventListener("input", () => {
      let v = cardExp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
      cardExp.value = v;
    });
  }

  // CVV: digits only, max 3
  const cardCvv = document.getElementById("courierCardCvv");
  if (cardCvv) {
    cardCvv.addEventListener("input", () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 3);
    });
  }
}

function goToForm() {
  if (!state.pickupId || !state.deliveryId) return toast("Alim ve teslim noktasi secin.", "err");
  if (!state.quote) return toast("Mesafe limiti asildi veya gecersiz rota.", "err");
  showCourierStep(2);
}

async function goToPayment() {
  const body = getFormData();
  if (!body) return;

  const btn = $("#courierToPayment");
  setLoading(btn, true);
  try {
    const res = await checkoutCourier(body);
    state.orderId = res.orderId;
    state.quote = res.quote;
    state.route = res.route || [];
    renderPaymentSummary(res);
    showCourierStep(3);
  } catch (err) {
    if (!err.authExpired && err.status !== 401) toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ödeme Adımına Geç");
  }
}

function getFormData() {
  const senderName = $("#courierSenderName")?.value.trim();
  const senderPhone = $("#courierSenderPhone")?.value.trim();
  const senderTc = $("#courierSenderTc")?.value.trim();
  const recipientName = $("#courierRecipientName")?.value.trim();
  const recipientPhone = $("#courierRecipientPhone")?.value.trim();
  const recipientTc = $("#courierRecipientTc")?.value.trim();
  const weightKg = Number($("#courierWeight")?.value);
  const lengthCm = Number($("#courierLength")?.value);
  const widthCm = Number($("#courierWidth")?.value);
  const heightCm = Number($("#courierHeight")?.value);

  if (!senderName || !senderPhone || !recipientName || !recipientPhone) {
    toast("Gönderici ve alıcı bilgilerini doldurun.", "err");
    return null;
  }
  if (!weightKg || weightKg <= 0) {
    toast("Agirlik girin.", "err");
    return null;
  }

  return {
    pickupPointId: state.pickupId,
    deliveryPointId: state.deliveryId,
    weightKg, lengthCm, widthCm, heightCm,
    senderName, senderPhone, senderTc, recipientName, recipientPhone, recipientTc,
    packageDescription: $("#courierDesc")?.value.trim() || "",
  };
}

function renderPaymentSummary(res) {
  const q = res.quote;
  const b = q.breakdown || {};
  $("#paymentSummary").innerHTML = `
    <div class="payment-row"><span>Taban ucret</span><span>${fmtMoney(b.baseFee)}</span></div>
    <div class="payment-row"><span>Mesafe (${b.distanceKm} km)</span><span>${fmtMoney(b.distanceCost)}</span></div>
    <div class="payment-row"><span>Agirlik (${b.weightKg} kg)</span><span>${fmtMoney(b.weightCost)}</span></div>
    <div class="payment-row"><span>Hacim (${b.volumeLiters} L)</span><span>${fmtMoney(b.volumeCost)}</span></div>
    <div class="payment-row total"><span>Toplam</span><span>${fmtMoney(q.price)}</span></div>
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
  const expiryEnd = new Date(year, month, 1);
  return now < expiryEnd;
}

async function processPayment() {
  if (!state.orderId) return toast("Sipariş bulunamadı.", "err");

  const cardName = $("#courierCardName")?.value.trim();
  const cardNo   = ($("#courierCardNo")?.value || "").replace(/\s/g, "");
  const cardExp  = $("#courierCardExp")?.value.trim();
  const cardCvv  = $("#courierCardCvv")?.value.trim();

  if (!cardName) { toast("Kart üzerindeki ismi girin.", "err"); return; }
  if (cardNo.length < 16) { toast("Kart numarası 16 haneli olmalıdır.", "err"); return; }
  if (cardExp.length < 4) { toast("Son kullanma tarihi girin (AA/YY).", "err"); return; }
  if (!isValidCardExpiry(cardExp)) { toast("Kartın son kullanma tarihi geçmiş veya geçersiz.", "err"); return; }
  if (cardCvv.length < 3) { toast("CVV 3 haneli olmalıdır.", "err"); return; }

  const btn = $("#courierPayBtn");
  setLoading(btn, true);
  try {
    const res = await payCourier(state.orderId);
    $("#courierPickupCode").textContent = res.pickupCode || "------";
    $("#courierDeliveryCode").textContent = res.deliveryCode || "------";
    $("#courierTrackingNo2").textContent = res.trackingNumber;
    showCourierStep(4);
    toast("Ödeme başarılı!", "ok");
    if (state.route.length) animateRider(state.route);
  } catch (err) {
    if (!err.authExpired && err.status !== 401) toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ödemeyi Tamamla");
  }
}

function animateRider(route) {
  if (!state.map || !route.length) return;
  if (state.animTimer) clearInterval(state.animTimer);
  if (state.riderMarker) state.map.removeLayer(state.riderMarker);

  let i = 0;
  const icon = L.divIcon({
    className: "",
    html: `<div class="courier-marker rider">🏍️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  state.riderMarker = L.marker([route[0].lat, route[0].lng], { icon, zIndexOffset: 1000 }).addTo(state.map);

  state.animTimer = setInterval(() => {
    i = (i + 1) % route.length;
    state.riderMarker.setLatLng([route[i].lat, route[i].lng]);
  }, 1200);
}

async function verifyCode(role) {
  const code = role === "pickup" ? $("#courierCodePickup")?.value.trim() : $("#courierCodeDelivery")?.value.trim();
  if (!code || !state.orderId) return toast("Sifre girin.", "err");
  try {
    await verifyDeliveryCode(state.orderId, code, role);
    toast(role === "pickup" ? "Kurye teslim aldı!" : "Alıcı teslim aldı!", "ok");
  } catch (err) {
    toast(err.message, "err");
  }
}

function resetCourierFlow(resetMap = true) {
  state.pickupId = null;
  state.deliveryId = null;
  state.quote = null;
  state.orderId = null;
  state.mode = "pickup";
  if (state.animTimer) clearInterval(state.animTimer);
  if (state.riderMarker && state.map) {
    state.map.removeLayer(state.riderMarker);
    state.riderMarker = null;
  }
  clearRoute();
  if (resetMap) highlightMarkers();
  updatePointUI();
  showCourierStep(1);
  $("#courierSuccess")?.classList.add("hidden");
  if (resetMap && state.map) state.map.setView([41.02, 28.97], 11);
}

// ─── Gönderi Sorgula ─────────────────────────────────────────────────

let queryMap = null;
let queryRiderMarker = null;
let queryRiderTimer = null;

function toggleQueryPanel() {
  const panel = $("#courierQueryPanel");
  const flow  = $("#courierMainFlow");
  const btn   = $("#courierQueryToggle");
  if (!panel) return;
  const isOpen = !panel.classList.contains("hidden");
  panel.classList.toggle("hidden", isOpen);
  if (flow) flow.classList.toggle("hidden", !isOpen);
  if (btn) btn.textContent = isOpen ? "🔍 Gönderi Sorgula" : "← Gönderi Oluştur";
  if (isOpen && queryRiderTimer) {
    clearInterval(queryRiderTimer);
    queryRiderTimer = null;
  }
}

async function doQuery() {
  const input = $("#courierQueryInput");
  const tn = input?.value.trim();
  if (!tn) { toast("Takip numarası girin.", "err"); return; }

  const btn = $("#courierQueryBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Aranıyor…"; }

  const resultBox = $("#courierQueryResult");
  if (resultBox) resultBox.innerHTML = "";

  try {
    const { apiFetch } = await import("./api.js");
    const res = await apiFetch(`/api/courier/track/${encodeURIComponent(tn)}`);
    renderQueryResult(res);
  } catch (e) {
    if (resultBox) resultBox.innerHTML = `<div class="card card-pad" style="color:#dc2626">⚠️ ${e.message}</div>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sorgula"; }
  }
}

function renderQueryResult(data) {
  const box = $("#courierQueryResult");
  const o = data.order;
  if (!box) return;

  const STATUS_MAP = {
    pending_payment: { label: "Ödeme Bekleniyor", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "⏳", step: 0 },
    order_received:  { label: "Sipariş Alındı",   color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "📋", step: 1 },
    picked_up:       { label: "Yolda",             color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", icon: "🏍️", step: 2 },
    delivered:       { label: "Teslim Edildi",     color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: "✅", step: 3 },
  };
  const s = STATUS_MAP[o.status] || { label: o.status, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "📦", step: 0 };

  const fmt = d => d ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)) : "—";
  const fmtMon = v => v != null ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v) : "—";

  let etaText = "";
  if (o.paidAt && o.estimatedMinutes && o.status !== "delivered") {
    const etaMs   = new Date(o.paidAt).getTime() + o.estimatedMinutes * 60000;
    const diffMin = Math.round((etaMs - Date.now()) / 60000);
    etaText = diffMin > 0
      ? `<span class="cq-eta-badge">⏱ ~${diffMin} dk</span>`
      : `<span class="cq-eta-badge">⏱ Teslimat bekleniyor…</span>`;
  }
  if (o.status === "delivered") etaText = `<span class="cq-eta-badge cq-eta-done">✅ Teslim edildi</span>`;

  const STEPS = [
    { key: "order_received", label: "Sipariş Alındı", icon: "📋" },
    { key: "picked_up",      label: "Yolda",          icon: "🏍️" },
    { key: "delivered",      label: "Teslim Edildi",  icon: "✅" },
  ];

  const stepsHtml = STEPS.map((step, i) => {
    const active  = s.step > i;
    const current = s.step === i + 1;
    return `
      <div class="cq-step ${active || current ? "cq-step--done" : ""} ${current ? "cq-step--current" : ""}">
        <div class="cq-step-dot">${active || current ? step.icon : i + 1}</div>
        <div class="cq-step-label">${step.label}</div>
      </div>
      ${i < STEPS.length - 1 ? `<div class="cq-step-line ${active ? "cq-step-line--done" : ""}"></div>` : ""}`;
  }).join("");

  box.innerHTML = `
    <div class="cq-result-card">
      <!-- Üst banner -->
      <div class="cq-result-banner" style="background:${s.bg};border-color:${s.color}40">
        <div class="cq-result-status-dot" style="background:${s.color}">
          <span>${s.icon}</span>
        </div>
        <div class="cq-result-status-text">
          <strong style="color:${s.color}">${s.label}</strong>
          <span class="cq-result-tn">${o.trackingNumber}</span>
        </div>
        ${etaText}
      </div>

      <!-- Adım göstergesi -->
      ${o.status !== "pending_payment" ? `<div class="cq-steps">${stepsHtml}</div>` : ""}

      <!-- Detaylar -->
      <div class="cq-detail-grid">
        <div class="cq-detail-col cq-detail-col--from">
          <div class="cq-detail-colhead">📤 Gönderen</div>
          <div class="cq-detail-name">${o.senderName || "—"}</div>
          <div class="cq-detail-addr">${o.pickupAddress?.split(" —")[0] || "—"}</div>
        </div>
        <div class="cq-detail-arrow">→</div>
        <div class="cq-detail-col cq-detail-col--to">
          <div class="cq-detail-colhead">📥 Alıcı</div>
          <div class="cq-detail-name">${o.recipientName || "—"}</div>
          <div class="cq-detail-addr">${o.deliveryAddress?.split(" —")[0] || "—"}</div>
        </div>
      </div>

      <!-- Ek bilgiler -->
      <div class="cq-info-row">
        <div class="cq-info-item">
          <span class="cq-info-label">Sipariş Tarihi</span>
          <span class="cq-info-val">${fmt(o.createdAt)}</span>
        </div>
        <div class="cq-info-item">
          <span class="cq-info-label">Ücret</span>
          <span class="cq-info-val">${fmtMon(o.price)}</span>
        </div>
        ${data.courier ? `
        <div class="cq-info-item">
          <span class="cq-info-label">Kurye</span>
          <span class="cq-info-val">${data.courier.name || "—"}</span>
        </div>
        ${data.courier.phone ? `
        <div class="cq-info-item">
          <span class="cq-info-label">Kurye Tel</span>
          <span class="cq-info-val"><a href="tel:${data.courier.phone}" style="color:var(--primary)">${data.courier.phone}</a></span>
        </div>` : ""}` : ""}
      </div>
    </div>`;

  if (o.status !== "pending_payment" && data.pickup && data.delivery) {
    const mapEl = $("#courierQueryMap");
    if (mapEl) {
      mapEl.style.display = "block";
      initQueryMap(data, o);
    }
  }
}

async function initQueryMap(data, order) {
  await loadLeaflet();
  const mapEl = document.getElementById("courierQueryMap");
  if (!mapEl) return;

  if (queryMap) {
    queryMap.remove();
    queryMap = null;
  }
  if (queryRiderTimer) { clearInterval(queryRiderTimer); queryRiderTimer = null; }

  const pickup   = data.pickup;
  const delivery = data.delivery;
  const route    = data.route || [];

  queryMap = L.map("courierQueryMap").setView([pickup.lat, pickup.lng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap", maxZoom: 18,
  }).addTo(queryMap);

  // Markers
  const pickIcon = L.divIcon({ className: "", html: `<div class="courier-marker pickup" title="${pickup.name}">A</div>`, iconSize: [28,28], iconAnchor: [14,14] });
  const delIcon  = L.divIcon({ className: "", html: `<div class="courier-marker delivery" title="${delivery.name}">T</div>`, iconSize: [28,28], iconAnchor: [14,14] });
  L.marker([pickup.lat, pickup.lng], { icon: pickIcon }).addTo(queryMap).bindPopup(`<b>Alım:</b> ${pickup.name}`);
  L.marker([delivery.lat, delivery.lng], { icon: delIcon }).addTo(queryMap).bindPopup(`<b>Teslim:</b> ${delivery.name}`);

  // Get real OSRM route for accurate simulation
  let routePoints = route.map(r => [r.lat, r.lng]);
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`;
    const osrmRes = await fetch(osrmUrl);
    const osrmData = await osrmRes.json();
    if (osrmData.code === "Ok" && osrmData.routes?.length) {
      routePoints = osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch { /* use fallback route */ }

  const polyline = L.polyline(routePoints, { color: "#1e5eff", weight: 4, opacity: 0.8 }).addTo(queryMap);
  queryMap.fitBounds(polyline.getBounds(), { padding: [40, 40] });

  if (order.status === "delivered") {
    // Show at destination
    const rIcon = L.divIcon({ className: "", html: `<div class="courier-marker rider">✅</div>`, iconSize: [32,32], iconAnchor: [16,16] });
    L.marker([delivery.lat, delivery.lng], { icon: rIcon, zIndexOffset: 1000 }).addTo(queryMap).bindPopup("Teslim Edildi");
    return;
  }

  // Animate rider based on real elapsed time
  if (order.status === "pending_payment") return;

  const paidAt    = order.paidAt ? new Date(order.paidAt).getTime() : Date.now();
  const totalMs   = (order.estimatedMinutes || 45) * 60000;
  const totalPts  = routePoints.length;
  const riderIcon = L.divIcon({ className: "", html: `<div class="courier-marker rider">🏍️</div>`, iconSize: [34,34], iconAnchor: [17,17] });
  queryRiderMarker = L.marker(routePoints[0], { icon: riderIcon, zIndexOffset: 1000 }).addTo(queryMap);

  function updateRiderPos() {
    const elapsed  = Date.now() - paidAt;
    const progress = Math.min(1, elapsed / totalMs);
    const idx      = Math.min(Math.floor(progress * (totalPts - 1)), totalPts - 1);
    queryRiderMarker.setLatLng(routePoints[idx]);

    // Popup with progress
    const remMin = Math.max(0, Math.round((totalMs - elapsed) / 60000));
    const pct    = Math.round(progress * 100);
    queryRiderMarker.bindPopup(`🏍️ Kurye yolda — %${pct} tamamlandı${remMin > 0 ? ` · ~${remMin} dk kaldı` : " · Teslimat yakın!"}`);

    if (progress >= 1 && queryRiderTimer) {
      clearInterval(queryRiderTimer);
      queryRiderMarker.setPopupContent("✅ Teslimat noktasına ulaşıldı!");
    }
  }

  updateRiderPos();
  queryRiderTimer = setInterval(updateRiderPos, 4000);
}
