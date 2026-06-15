import { apiFetch } from "./api.js";
import { toast } from "./ui.js";

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

const STEPS = [
  {
    id: "moving_type",
    q: "Taşınacak alanın türü nedir?",
    opts: [
      { label: "🏠 Ev Taşıma", val: "ev" },
      { label: "🏢 Ofis / İş Yeri Taşıma", val: "ofis" },
    ],
  },
  {
    id: "room_size",
    q: "Evinizin / Ofisinizin büyüklüğü nedir?",
    opts: [
      { label: "1+1 veya Stüdyo Daire", val: "1+1" },
      { label: "2+1 Standart Daire", val: "2+1" },
      { label: "3+1 Geniş Daire", val: "3+1" },
      { label: "4+1 veya Villa / Büyük Ofis", val: "4+1+" },
    ],
  },
  {
    id: "origin_floor",
    q: "Mevcut adresiniz kaçıncı katta ve asansör var mı?",
    opts: [
      { label: "Giriş Kat / Müstakil Ev", val: "giris" },
      { label: "1 – 4. Kat Arası (Asansörlü)", val: "1-4-asansorlu" },
      { label: "1 – 4. Kat Arası (Asansörsüz)", val: "1-4-asansorsuz" },
      { label: "5. Kat ve Üzeri (Asansörlü)", val: "5-asansorlu" },
      { label: "5. Kat ve Üzeri (Asansörsüz)", val: "5-asansorsuz" },
    ],
  },
  {
    id: "dest_floor",
    q: "Taşınılacak yeni adres kaçıncı katta ve asansör var mı?",
    opts: [
      { label: "Giriş Kat / Müstakil Ev", val: "giris" },
      { label: "1 – 4. Kat Arası (Asansörlü)", val: "1-4-asansorlu" },
      { label: "1 – 4. Kat Arası (Asansörsüz)", val: "1-4-asansorsuz" },
      { label: "5. Kat ve Üzeri (Asansörlü)", val: "5-asansorlu" },
      { label: "5. Kat ve Üzeri (Asansörsüz)", val: "5-asansorsuz" },
    ],
  },
  {
    id: "packing_service",
    q: "Paketleme ve kolileme hizmeti istiyor musunuz?",
    opts: [
      { label: "Hayır, tüm paketlemeyi kendim yaparım", val: "yok" },
      { label: "Sadece büyük mobilya ve beyaz eşyalar paketlensin", val: "buyuk" },
      { label: "Evet, her şeyi nakliyeci paketlesin", val: "tam" },
    ],
  },
];

let state = {
  step: 0,
  answers: {},
  price: 0,
  distanceKm: null,
  orderId: null,
  confirmCode: null,
  // address coords for routing
  originCoords: null,   // { lat, lon, display }
  destCoords: null,     // { lat, lon, display }
};

export function initMovingWizard(container, onBack) {
  state = {
    step: 0, answers: {}, price: 0, distanceKm: null,
    orderId: null, confirmCode: null,
    originCoords: null, destCoords: null,
  };
  render(container, onBack);
}

function render(container, onBack) {
  if (state.step < STEPS.length) {
    renderStep(container, onBack);
  } else if (state.step === STEPS.length) {
    renderAddress(container, onBack);
  } else if (state.step === STEPS.length + 1) {
    renderPrice(container, onBack);
  } else if (state.step === STEPS.length + 2) {
    renderPayment(container);
  } else {
    renderDone(container);
  }
}

function progress() {
  const total = STEPS.length + 3;
  const pct = Math.round(((state.step + 1) / total) * 100);
  return `<div class="mv-progress"><div class="mv-progress-bar" style="width:${pct}%"></div></div>`;
}

function renderStep(container, onBack) {
  const step = STEPS[state.step];
  const selected = state.answers[step.id];

  container.innerHTML = `
    ${progress()}
    <div class="mv-question">${step.q}</div>
    <div class="mv-options">
      ${step.opts.map(o => `
        <button class="mv-opt${selected === o.val ? " selected" : ""}" data-val="${o.val}" type="button">
          ${o.label}
        </button>`).join("")}
    </div>
    <div class="mv-nav">
      <button class="btn btn-outline btn-sm" id="mvBack" type="button">${state.step === 0 ? "← Geri Dön" : "← Geri"}</button>
      <button class="btn btn-primary btn-sm" id="mvNext" type="button">${state.step === STEPS.length - 1 ? "Devam Et" : "İleri →"}</button>
    </div>`;

  container.querySelectorAll(".mv-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".mv-opt").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.answers[step.id] = btn.dataset.val;
    });
  });

  container.querySelector("#mvBack").addEventListener("click", () => {
    if (state.step === 0) { onBack(); return; }
    state.step--;
    render(container, onBack);
  });

  container.querySelector("#mvNext").addEventListener("click", () => {
    if (!state.answers[step.id]) { toast("Lütfen bir seçenek seçin.", "err"); return; }
    state.step++;
    render(container, onBack);
  });
}

// ─── Geocoding (Nominatim) ───────────────────────────────────────────
let _geocodeTimers = {};

async function geocodeSearch(query) {
  if (!query || query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=tr&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "tr" } });
    const data = await res.json();
    return data.map(d => ({
      display: d.display_name,
      short: buildShortLabel(d),
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
    }));
  } catch { return []; }
}

function buildShortLabel(d) {
  const a = d.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway || "",
    a.neighbourhood || a.suburb || a.quarter || "",
    a.district || a.county || a.town || "",
    a.city || a.municipality || a.province || a.state || "",
  ].filter(Boolean);
  return parts.length ? parts.slice(0, 3).join(", ") : d.display_name;
}

// ─── Road distance (OSRM public API) ────────────────────────────────
async function calcRouteDistance(origin, dest) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("Rota hesaplanamadı.");
  const meters = data.routes[0].distance;
  const seconds = data.routes[0].duration;
  return {
    km: Math.round(meters / 100) / 10,      // 1 ondalık
    minutes: Math.round(seconds / 60),
  };
}

// ─── Autocomplete widget ─────────────────────────────────────────────
function attachAutocomplete(container, inputId, dropdownId, onSelect) {
  const input = container.querySelector(`#${inputId}`);
  const dropdown = container.querySelector(`#${dropdownId}`);
  if (!input || !dropdown) return;

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    const q = input.value.trim();
    if (q.length < 3) return;
    debounceTimer = setTimeout(async () => {
      dropdown.innerHTML = `<div class="mv-ac-item mv-ac-loading">🔍 Aranıyor…</div>`;
      dropdown.classList.remove("hidden");
      const results = await geocodeSearch(q);
      if (!results.length) {
        dropdown.innerHTML = `<div class="mv-ac-item mv-ac-empty">Sonuç bulunamadı.</div>`;
        return;
      }
      dropdown.innerHTML = results.map((r, i) => `
        <div class="mv-ac-item" data-idx="${i}" title="${r.display}">
          <span class="mv-ac-main">${r.short}</span>
          <span class="mv-ac-sub">${r.display.slice(0, 80)}${r.display.length > 80 ? "…" : ""}</span>
        </div>`).join("");

      dropdown.querySelectorAll(".mv-ac-item[data-idx]").forEach(item => {
        item.addEventListener("mousedown", e => {
          e.preventDefault();
          const r = results[parseInt(item.dataset.idx)];
          input.value = r.short;
          dropdown.innerHTML = "";
          dropdown.classList.add("hidden");
          onSelect(r);
        });
      });
    }, 400);
  });

  // hide on blur
  input.addEventListener("blur", () => {
    setTimeout(() => {
      dropdown.innerHTML = "";
      dropdown.classList.add("hidden");
    }, 200);
  });
}

// ─── renderAddress ───────────────────────────────────────────────────
function renderAddress(container, onBack) {
  const prevOrigin = state.originCoords;
  const prevDest   = state.destCoords;

  container.innerHTML = `
    ${progress()}
    <div class="mv-question">Adres ve iletişim bilgileriniz</div>
    <div class="mv-fields">
      <div class="field mv-addr-field">
        <label>📍 Mevcut Adres <span class="mv-addr-hint">(taşınacak konum)</span></label>
        <div class="mv-ac-wrap">
          <input class="input" id="mvOrigin" placeholder="Mahalle, sokak veya tam adres yazın…"
            value="${prevOrigin ? prevOrigin.short || "" : ""}" autocomplete="off" />
          <div class="mv-ac-dropdown hidden" id="mvOriginDrop"></div>
        </div>
        <div id="mvOriginTag" class="mv-addr-tag${prevOrigin ? "" : " hidden"}">
          ✓ ${prevOrigin?.short || ""}
        </div>
      </div>

      <div class="field mv-addr-field">
        <label>🏁 Yeni Adres <span class="mv-addr-hint">(taşınılacak konum)</span></label>
        <div class="mv-ac-wrap">
          <input class="input" id="mvDest" placeholder="Mahalle, sokak veya tam adres yazın…"
            value="${prevDest ? prevDest.short || "" : ""}" autocomplete="off" />
          <div class="mv-ac-dropdown hidden" id="mvDestDrop"></div>
        </div>
        <div id="mvDestTag" class="mv-addr-tag${prevDest ? "" : " hidden"}">
          ✓ ${prevDest?.short || ""}
        </div>
      </div>

      <div id="mvDistanceRow" class="mv-distance-row${(prevOrigin && prevDest) ? "" : " hidden"}">
        <div id="mvDistanceBox" class="mv-distance-box">
          ${state.distanceKm != null
            ? distanceHTML(state.distanceKm)
            : `<span class="mv-dist-loading">🗺️ Mesafe hesaplanıyor…</span>`}
        </div>
      </div>

      <div class="field"><label>Ad Soyad</label><input class="input" id="mvName" placeholder="Ad Soyad" /></div>
      <div class="field"><label>Telefon</label><input class="input" id="mvPhone" placeholder="05xx xxx xx xx" /></div>
    </div>
    <div class="mv-nav">
      <button class="btn btn-outline btn-sm" id="mvBack" type="button">← Geri</button>
      <button class="btn btn-primary btn-sm" id="mvNext" type="button">Fiyat Al →</button>
    </div>`;

  // ── Attach autocomplete ───────────────────────────────────────────
  attachAutocomplete(container, "mvOrigin", "mvOriginDrop", (r) => {
    state.originCoords = r;
    const tag = container.querySelector("#mvOriginTag");
    if (tag) { tag.textContent = `✓ ${r.short}`; tag.classList.remove("hidden"); }
    tryCalcDistance(container);
  });

  attachAutocomplete(container, "mvDest", "mvDestDrop", (r) => {
    state.destCoords = r;
    const tag = container.querySelector("#mvDestTag");
    if (tag) { tag.textContent = `✓ ${r.short}`; tag.classList.remove("hidden"); }
    tryCalcDistance(container);
  });

  // ── If coords already set from prev visit, try calc immediately ───
  if (prevOrigin && prevDest && state.distanceKm == null) {
    tryCalcDistance(container);
  }

  // ── Back ──────────────────────────────────────────────────────────
  container.querySelector("#mvBack").addEventListener("click", () => {
    state.step--;
    render(container, onBack);
  });

  // ── Next / submit ─────────────────────────────────────────────────
  container.querySelector("#mvNext").addEventListener("click", async () => {
    const originAddress = state.originCoords?.display || container.querySelector("#mvOrigin").value.trim();
    const destAddress   = state.destCoords?.display   || container.querySelector("#mvDest").value.trim();
    const contactName   = container.querySelector("#mvName").value.trim();
    const contactPhone  = container.querySelector("#mvPhone").value.trim();

    if (!originAddress) { toast("Mevcut adresi seçin veya girin.", "err"); return; }
    if (!destAddress)   { toast("Yeni adresi seçin veya girin.", "err"); return; }
    if (!contactName)   { toast("Ad soyad girin.", "err"); return; }
    if (!contactPhone)  { toast("Telefon girin.", "err"); return; }

    const btn = container.querySelector("#mvNext");
    btn.disabled = true;
    btn.textContent = "Hesaplanıyor…";
    try {
      // if we have coords but no distance yet, calc now
      if (!state.distanceKm && state.originCoords && state.destCoords) {
        const route = await calcRouteDistance(state.originCoords, state.destCoords);
        state.distanceKm = route.km;
      }

      const res = await apiFetch("/api/moving", {
        method: "POST",
        body: {
          movingType: state.answers.moving_type,
          roomSize: state.answers.room_size,
          originFloor: state.answers.origin_floor,
          destFloor: state.answers.dest_floor,
          packingService: state.answers.packing_service,
          originAddress, destAddress, contactName, contactPhone,
          distanceKm: state.distanceKm ?? null,
        },
      });
      state.price = res.price;
      state.distanceKm = res.distanceKm ?? state.distanceKm;
      state.orderId = res.order.id;
      state.step++;
      render(container, onBack);
    } catch (e) {
      toast(e.message, "err");
      btn.disabled = false;
      btn.textContent = "Fiyat Al →";
    }
  });
}

async function tryCalcDistance(container) {
  if (!state.originCoords || !state.destCoords) return;
  const row = container.querySelector("#mvDistanceRow");
  const box = container.querySelector("#mvDistanceBox");
  if (row) row.classList.remove("hidden");
  if (box) box.innerHTML = `<span class="mv-dist-loading">🗺️ Yol mesafesi hesaplanıyor…</span>`;
  try {
    const route = await calcRouteDistance(state.originCoords, state.destCoords);
    state.distanceKm = route.km;
    if (box) box.innerHTML = distanceHTML(route.km, route.minutes);
  } catch (e) {
    if (box) box.innerHTML = `<span class="mv-dist-err">⚠️ Mesafe hesaplanamadı (${e.message})</span>`;
  }
}

function distanceHTML(km, minutes) {
  const kmStr = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString("tr-TR")} km`;
  const minStr = minutes != null ? `· yaklaşık ${minutes} dk` : "";
  return `
    <div class="mv-dist-result">
      <span class="mv-dist-icon">🛣️</span>
      <div>
        <strong class="mv-dist-km">${kmStr}</strong>
        <span class="mv-dist-min">${minStr}</span>
      </div>
      <span class="mv-dist-label">Yol Mesafesi</span>
    </div>`;
}

// ─── Price result ────────────────────────────────────────────────────
function renderPrice(container, onBack) {
  const fmt = v => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
  const kmLabel = state.distanceKm != null
    ? `<div class="mv-result-dist">🛣️ Yol mesafesi: <strong>${state.distanceKm.toLocaleString("tr-TR")} km</strong></div>`
    : "";

  container.innerHTML = `
    ${progress()}
    <div class="mv-result">
      <div class="mv-result-icon">🚛</div>
      <div class="mv-result-label">Tahmini Nakliyat Bedeli</div>
      <div class="mv-result-price">${fmt(state.price)}</div>
      ${kmLabel}
      <p class="mv-result-note">* Fiyat 12.500 TL – 55.000 TL arasında hesaplanmıştır.<br>Mesafe, kat ve paketleme bilgileri dikkate alınmıştır.</p>
    </div>
    <div class="mv-nav mv-nav-center">
      <button class="btn btn-outline btn-sm" id="mvBack" type="button">← Başa Dön</button>
      <button class="btn btn-primary" id="mvPay" type="button">Ödemeye Geç →</button>
    </div>`;

  container.querySelector("#mvBack").addEventListener("click", () => {
    state.step = 0;
    state.answers = {};
    state.orderId = null;
    state.distanceKm = null;
    state.originCoords = null;
    state.destCoords = null;
    render(container, onBack);
  });

  container.querySelector("#mvPay").addEventListener("click", () => {
    state.step++;
    render(container, onBack);
  });
}

// ─── Payment ─────────────────────────────────────────────────────────
function renderPayment(container) {
  const fmt = v => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);

  container.innerHTML = `
    ${progress()}
    <div class="mv-payment-head">
      <div class="mv-payment-icon">💳</div>
      <h3>Ödeme Bilgileri</h3>
      <p class="muted">Toplam tutar: <strong>${fmt(state.price)}</strong></p>
    </div>
    <div class="mv-fields">
      <div class="field"><label>Kart Üzerindeki Ad</label><input class="input" id="mvCardName" placeholder="Ad Soyad" /></div>
      <div class="field"><label>Kart Numarası</label><input class="input" id="mvCardNo" placeholder="1234 5678 9012 3456" maxlength="19" /></div>
      <div class="mv-card-row">
        <div class="field"><label>Son Kullanma</label><input class="input" id="mvCardExp" placeholder="AA/YY" maxlength="5" /></div>
        <div class="field"><label>CVV</label><input class="input" id="mvCardCvv" placeholder="123" maxlength="3" type="password" /></div>
      </div>
    </div>
    <p class="mv-demo-note">⚠️ Bu demo ödeme ekranıdır. Gerçek kart bilgisi girilmez.</p>
    <div class="mv-nav mv-nav-center">
      <button class="btn btn-primary" id="mvConfirmPay" type="button">Ödemeyi Onayla ✓</button>
    </div>`;

  const cardInput = container.querySelector("#mvCardNo");
  cardInput?.addEventListener("input", () => {
    let v = cardInput.value.replace(/\D/g, "").slice(0, 16);
    cardInput.value = v.replace(/(.{4})/g, "$1 ").trim();
  });
  const expInput = container.querySelector("#mvCardExp");
  expInput?.addEventListener("input", () => {
    let v = expInput.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    expInput.value = v;
  });

  container.querySelector("#mvConfirmPay").addEventListener("click", async (e) => {
    const name = container.querySelector("#mvCardName").value.trim();
    const no   = container.querySelector("#mvCardNo").value.replace(/\s/g, "");
    const exp  = container.querySelector("#mvCardExp").value.trim();
    const cvv  = container.querySelector("#mvCardCvv").value.trim();
    if (!name || no.length < 16 || exp.length < 4 || cvv.length < 3) {
      toast("Lütfen tüm kart bilgilerini eksiksiz girin.", "err"); return;
    }
    if (!isValidCardExpiry(exp)) {
      toast("Kartın son kullanma tarihi geçmiş veya geçersiz.", "err"); return;
    }
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "İşleniyor…";
    try {
      const res = await apiFetch("/api/moving/pay", {
        method: "POST",
        body: { orderId: state.orderId },
      });
      state.confirmCode = res.confirmCode;
      state.step++;
      render(container, null);
    } catch (err) {
      toast(err.message, "err");
      btn.disabled = false;
      btn.textContent = "Ödemeyi Onayla ✓";
    }
  });
}

// ─── Done ─────────────────────────────────────────────────────────────
function renderDone(container) {
  container.innerHTML = `
    <div class="mv-done">
      <div class="mv-done-icon">✅</div>
      <h2>Nakliyat Siparişiniz Alındı!</h2>
      <p>Ödemeniz başarıyla işlendi. Nakliyeci atandığında bilgilendirileceksiniz.</p>
      <div class="mv-code-box">
        <small>Müşteri Doğrulama Kodu</small>
        <strong>${state.confirmCode || "——"}</strong>
      </div>
      <p class="mv-result-note">Bu kodu nakliyecinize iş tesliminde gösterin. Kodu kimseyle paylaşmayın.</p>
      <button class="btn btn-outline" id="mvDoneBack" type="button">Ana Sayfaya Dön</button>
    </div>`;

  container.querySelector("#mvDoneBack")?.addEventListener("click", () => {
    window.location.href = "app.html";
  });
}
