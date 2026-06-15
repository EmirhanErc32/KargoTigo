import { apiFetch } from "./api.js";
import { toast } from "./ui.js";
import { citySelect, fetchCities } from "./city-select.js";
import { findCarrierDomain } from "./carrier-brands.js";

let state = {
  step: 0,
  items: [],
  currentItem: {},
  origin: "",
  destination: "",
  contactName: "",
  contactPhone: "",
  results: null,
};

let _onBack = null;
let _container = null;

export function initTopluKargo(container, onBack) {
  _container = container;
  _onBack = onBack;
  state = { step: 0, items: [], currentItem: {}, origin: "", destination: "", contactName: "", contactPhone: "", results: null };
  render();
}

function render() {
  if (!_container) return;
  const steps = [renderItemEntry, renderItemList, renderShipping, renderResults];
  (steps[state.step] || renderItemEntry)();
}

function progress() {
  const pct = Math.round(((state.step + 1) / 4) * 100);
  return `<div class="mv-progress"><div class="mv-progress-bar" style="width:${pct}%"></div></div>`;
}

function fmt(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
}

// ─── Step 0: Ürün girişi ─────────────────────────────────────
function renderItemEntry() {
  const hasPrev = state.items.length > 0;
  _container.innerHTML = `
    ${progress()}
    <div class="mv-question">Göndereceğiniz ürünü tanımlayın</div>

    <div class="mv-fields" id="tlManual">
      <div class="field"><label>Ürün Adı</label><input class="input" id="tlProdName" placeholder="Örn: Laptop, Koli, Kitap" value="${state.currentItem.name || ""}" /></div>
      <div class="tl-dim-row">
        <div class="field"><label>Uzunluk (cm)</label><input class="input" id="tlLen" type="number" min="1" placeholder="cm" value="${state.currentItem.lengthCm || ""}" /></div>
        <div class="field"><label>Genişlik (cm)</label><input class="input" id="tlWid" type="number" min="1" placeholder="cm" value="${state.currentItem.widthCm || ""}" /></div>
        <div class="field"><label>Yükseklik (cm)</label><input class="input" id="tlHei" type="number" min="1" placeholder="cm" value="${state.currentItem.heightCm || ""}" /></div>
      </div>
      <div class="tl-weight-row">
        <div class="field">
          <label>Ağırlık (kg)</label>
          <input class="input" id="tlWeight" type="number" min="0.1" step="0.1" placeholder="kg" value="${state.currentItem.weightKg || ""}" />
        </div>
        <div class="field">
          <label>Adet</label>
          <input class="input" id="tlQty" type="number" min="1" value="${state.currentItem.qty || 1}" />
        </div>
      </div>
      <p class="mv-result-note" id="tlVolHint"></p>
    </div>

    <div class="mv-nav">
      <button class="btn btn-outline btn-sm" id="tlBack" type="button">${hasPrev ? "← İptal" : "← Geri"}</button>
      <button class="btn btn-primary btn-sm" id="tlAddItem" type="button">${hasPrev ? "Ürün Ekle" : "Devam Et"}</button>
    </div>
    ${hasPrev ? `<button class="btn btn-outline btn-sm" id="tlSkipToList" type="button" style="width:100%;margin-top:8px">Ürün listesine git (${state.items.length} ürün) →</button>` : ""}`;

  // Volume hint
  const volHint = _container.querySelector("#tlVolHint");
  ["tlLen","tlWid","tlHei","tlWeight"].forEach(id => {
    _container.querySelector(`#${id}`)?.addEventListener("input", () => {
      const l = +_container.querySelector("#tlLen")?.value || 0;
      const w = +_container.querySelector("#tlWid")?.value || 0;
      const h = +_container.querySelector("#tlHei")?.value || 0;
      if (l && w && h && volHint) volHint.textContent = `Hacim: ${((l*w*h)/1000).toFixed(1)} L`;
    });
  });

  // Back
  _container.querySelector("#tlBack")?.addEventListener("click", () => {
    if (state.items.length > 0) { state.step = 1; render(); }
    else _onBack?.();
  });

  _container.querySelector("#tlSkipToList")?.addEventListener("click", () => { state.step = 1; render(); });

  // Add item
  _container.querySelector("#tlAddItem")?.addEventListener("click", () => {
    const name     = _container.querySelector("#tlProdName")?.value.trim();
    const lengthCm = +_container.querySelector("#tlLen")?.value;
    const widthCm  = +_container.querySelector("#tlWid")?.value;
    const heightCm = +_container.querySelector("#tlHei")?.value;
    const weightKg = +_container.querySelector("#tlWeight")?.value;
    const qty      = Math.max(1, +_container.querySelector("#tlQty")?.value || 1);

    if (!name)          { toast("Ürün adı girin.", "err"); return; }
    if (!lengthCm || !widthCm || !heightCm) { toast("Boyutları (cm) girin.", "err"); return; }
    if (!weightKg)      { toast("Ağırlık girin.", "err"); return; }

    state.items.push({ name, lengthCm, widthCm, heightCm, weightKg, qty });
    state.currentItem = {};
    state.step = 1;
    render();
  });
}

// ─── Step 1: Ürün listesi ────────────────────────────────────
function renderItemList() {
  const totalWeight = state.items.reduce((s, i) => s + i.weightKg * i.qty, 0);
  const totalVol    = state.items.reduce((s, i) => s + (i.lengthCm * i.widthCm * i.heightCm / 1000) * i.qty, 0);

  _container.innerHTML = `
    ${progress()}
    <div class="mv-question">Gönderi Listesi (${state.items.length} ürün)</div>
    <div class="tl-item-list">
      ${state.items.map((item, idx) => `
        <div class="tl-item-row">
          <div class="tl-item-info">
            <strong>${item.name}</strong>
            <span>${item.lengthCm}×${item.widthCm}×${item.heightCm} cm · ${item.weightKg} kg × <strong>${item.qty} adet</strong></span>
          </div>
          <button class="btn btn-sm btn-ghost tl-remove-btn" data-idx="${idx}" type="button">🗑</button>
        </div>`).join("")}
    </div>
    <div class="tl-summary-row">
      <span>Toplam: <strong>${totalWeight.toFixed(1)} kg</strong> · <strong>${totalVol.toFixed(1)} L</strong></span>
    </div>
    <div class="mv-nav">
      <button class="btn btn-outline btn-sm" id="tlAddMore" type="button">+ Ürün Ekle</button>
      <button class="btn btn-primary btn-sm" id="tlNextToShip" type="button">Devam Et →</button>
    </div>`;

  _container.querySelectorAll(".tl-remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.items.splice(+btn.dataset.idx, 1);
      if (!state.items.length) { state.step = 0; render(); }
      else render();
    });
  });

  _container.querySelector("#tlAddMore")?.addEventListener("click", () => { state.step = 0; render(); });
  _container.querySelector("#tlNextToShip")?.addEventListener("click", () => { state.step = 2; render(); });
}

// ─── Step 2: Gönderim bilgileri ──────────────────────────────
function renderShipping() {
  _container.innerHTML = `
    ${progress()}
    <div class="mv-question">Gönderim Bilgileri</div>
    <div class="mv-fields">
      <div class="field">
        <label>📍 Çıkış Şehri</label>
        <input class="input" id="tlOrigin" placeholder="Şehir ara…" value="${state.origin}" autocomplete="off" />
      </div>
      <div class="field">
        <label>🏁 Varış Şehri</label>
        <input class="input" id="tlDest" placeholder="Şehir ara…" value="${state.destination}" autocomplete="off" />
      </div>
      <div class="field"><label>Gönderici Adı</label><input class="input" id="tlContact" placeholder="Ad Soyad" value="${state.contactName}" /></div>
      <div class="field"><label>Telefon</label><input class="input" id="tlPhone" type="tel" maxlength="11" placeholder="05XX XXX XX XX" value="${state.contactPhone}" /></div>
    </div>
    <div class="mv-nav">
      <button class="btn btn-outline btn-sm" id="tlBack2" type="button">← Geri</button>
      <button class="btn btn-primary btn-sm" id="tlGetPrices" type="button">Fiyatları Al →</button>
    </div>`;

  // Custom city selects
  fetchCities().then(cities => {
    citySelect(_container.querySelector("#tlOrigin"), {
      cities,
      onSelect: v => { state.origin = v; }
    });
    citySelect(_container.querySelector("#tlDest"), {
      cities,
      onSelect: v => { state.destination = v; }
    });
  });

  // Phone: digits only
  _container.querySelector("#tlPhone")?.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
  });

  _container.querySelector("#tlBack2")?.addEventListener("click", () => { state.step = 1; render(); });

  _container.querySelector("#tlGetPrices")?.addEventListener("click", async () => {
    const origin       = _container.querySelector("#tlOrigin")?.value.trim();
    const destination  = _container.querySelector("#tlDest")?.value.trim();
    const contactName  = _container.querySelector("#tlContact")?.value.trim();
    const contactPhone = _container.querySelector("#tlPhone")?.value.trim();
    if (!origin || !destination) { toast("Çıkış ve varış şehrini girin.", "err"); return; }

    state.origin       = origin;
    state.destination  = destination;
    state.contactName  = contactName;
    state.contactPhone = contactPhone;

    const btn = _container.querySelector("#tlGetPrices");
    btn.disabled = true; btn.textContent = "Hesaplanıyor…";
    try {
      const totalWeight = state.items.reduce((s, i) => s + i.weightKg * i.qty, 0);
      const maxLen = Math.max(...state.items.map(i => i.lengthCm));
      const maxWid = Math.max(...state.items.map(i => i.widthCm));
      const maxHei = Math.max(...state.items.map(i => i.heightCm));

      const res = await apiFetch("/api/shipping/quote", {
        method: "POST",
        body: {
          originCity: origin, destinationCity: destination,
          weightKg: totalWeight, lengthCm: maxLen, widthCm: maxWid, heightCm: maxHei,
          urgency: "standard",
        },
      });
      state.results = res;
      state.step = 3;
      render();
    } catch (e) {
      toast(e.message, "err");
      btn.disabled = false; btn.textContent = "Fiyatları Al →";
    }
  });
}

// ─── Step 3: Sonuçlar ────────────────────────────────────────
function renderResults() {
  const res = state.results;
  const totalWeight = state.items.reduce((s, i) => s + i.weightKg * i.qty, 0).toFixed(1);
  const totalItems  = state.items.reduce((s, i) => s + i.qty, 0);
  const distKm      = res?.distanceKm ? `~${res.distanceKm} km` : "";

  const feasible   = (res?.options || []).filter(o => o.feasible);
  const infeasible = (res?.options || []).filter(o => !o.feasible);

  function carrierLogoHtml(o) {
    const domain = findCarrierDomain({ carrierId: o.carrierId, carrier: o.carrier });
    const initials = String(o.carrier || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (domain) {
      return `<div class="tl-logo-wrap">
        <img class="tl-logo-img" src="https://www.google.com/s2/favicons?domain=${domain}&sz=64"
          alt="${o.carrier}" width="36" height="36"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <span class="tl-logo-fallback" style="background:${o.color || '#2a3766'};display:none">${initials}</span>
      </div>`;
    }
    return `<div class="tl-logo-wrap">
      <span class="tl-logo-fallback" style="background:${o.color || '#2a3766'}">${initials}</span>
    </div>`;
  }

  function vehicleIcon(v = "") {
    const m = { motosiklet: "🏍️", van: "🚐", kamyon: "🚛", ucak: "✈️", gemi: "🚢" };
    return m[v.toLowerCase()] || "📦";
  }

  function cardHtml(o, isBest) {
    const days = o.estimatedDays ? `${o.estimatedDays} gün` : "";
    return `
      <div class="tl-price-card${isBest ? " tl-price-best" : ""}">
        ${isBest ? `<span class="tl-best-badge">En İyi</span>` : ""}
        ${carrierLogoHtml(o)}
        <div class="tl-price-info">
          <strong class="tl-carrier-name">${o.carrier || "—"}</strong>
          <span class="tl-carrier-sub">
            ${vehicleIcon(o.vehicle)} ${o.vehicleLabel || o.vehicle || ""}
            ${days ? `· ${days}` : ""}
          </span>
        </div>
        <div class="tl-price-right">
          <strong class="tl-price-val">${fmt(o.price)}</strong>
          <span class="tl-price-meta">${totalItems} adet · ${totalWeight} kg</span>
        </div>
      </div>`;
  }

  const feasibleHtml = feasible.map((o, i) => cardHtml(o, i === 0)).join("");
  const infeasibleHtml = infeasible.length ? `
    <details class="tl-infeasible-details">
      <summary>Uygun olmayan firmalar (${infeasible.length})</summary>
      ${infeasible.map(o => `
        <div class="tl-price-card tl-price-disabled">
          ${carrierLogoHtml(o)}
          <div class="tl-price-info">
            <strong class="tl-carrier-name">${o.carrier || "—"}</strong>
            <span class="tl-carrier-sub" style="color:#ef4444">${o.reasons?.join(", ") || "Uygun değil"}</span>
          </div>
        </div>`).join("")}
    </details>` : "";

  _container.innerHTML = `
    ${progress()}
    <div class="mv-question">Fiyat Karşılaştırması</div>
    <div class="tl-summary-card">
      <span>📦 ${totalItems} ürün</span>
      <span>⚖️ ${totalWeight} kg</span>
      <span>📍 ${state.origin} → ${state.destination}</span>
      ${distKm ? `<span>🛣️ ${distKm}</span>` : ""}
    </div>
    <div class="tl-price-list">
      ${feasibleHtml || '<p class="muted">Uygun firma bulunamadı.</p>'}
    </div>
    ${infeasibleHtml}
    <p class="mv-result-note" style="margin-top:16px">* Fiyatlar tahmini referans fiyatlarıdır. Gerçek fiyat için ilgili firmaya başvurun.</p>
    <div class="mv-nav" style="margin-top:20px">
      <button class="btn btn-outline btn-sm" id="tlRestart" type="button">← Yeniden Başla</button>
      <button class="btn btn-primary btn-sm" id="tlBackToDash" type="button">Panele Dön</button>
    </div>`;

  _container.querySelector("#tlRestart")?.addEventListener("click", () => initTopluKargo(_container, _onBack));
  _container.querySelector("#tlBackToDash")?.addEventListener("click", () => _onBack?.());
}
