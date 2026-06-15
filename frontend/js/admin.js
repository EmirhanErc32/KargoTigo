import { $, $$, toast, setLoading, fmtMoney } from "./ui.js";
import { apiFetch } from "./api.js";
import {
  requireLogin, verifySession, getUser, logout,
  redirectIfWrongAppPage, resolveUserRole, getDisplayName,
} from "./auth.js";

if (!requireLogin()) throw new Error("yonlendiriliyor");

const SECTION_META = {
  overview: { title: "Genel Görünüm", sub: "Platform analizi ve haftalık trendler" },
  "depot-create": { title: "Depo Oluşturma", sub: "Yeni depo noktası tanımlama" },
  warehouses: { title: "Depo İşlemleri", sub: "Stok takibi, yetkili atama ve ürün detayları" },
  ai: { title: "AI Kullanımı", sub: "Fotoğraf analiz geçmişi" },
  users: { title: "Kullanıcılar", sub: "Kayıtlı kullanıcı listesi" },
  courier: { title: "G. Kurye İşlemleri", sub: "Günlük kurye siparişleri ve teslimat durumu" },
  nakliyat: { title: "Nakliyat Siparişleri", sub: "Gelen nakliyat işleri ve nakliyeci atamaları" },
  "nakliyeci-create": { title: "Nakliyeci Hesap Oluştur", sub: "Yeni nakliyeci paneli hesabı oluştur" },
  "kurye-create": { title: "Kurye Yönetimi", sub: "Moto kurye hesapları ve sipariş atamaları" },
};

let state = {
  section: "overview",
  stats: {},
  analytics: { labels: [], weeklyAi: [], weeklyCourier: [], weeklyWarehouse: [] },
  logins: [],
  activity: {},
  activityLoaded: false,
  warehouses: [],
  selectedWarehouseId: null,
  warehouseDetail: null,
  whSearch: "",
  whTab: "products",
  movingOrders: [],
  nakliyeciler: [],
  kuryeler: [],
  courierOrdersAdmin: [],
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtLogin(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function esc(s = "") {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableWrap(cols, rows) {
  if (!rows.length) return `<p class="admin-empty">Kayıt bulunamadı.</p>`;
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

function renderLoginLog() {
  const ul = $("#adminLoginList");
  if (!ul) return;
  if (!state.logins.length) {
    ul.innerHTML = `<li>Giriş kaydı yok</li>`;
    return;
  }
  ul.innerHTML = state.logins.map((l) => `
    <li>
      <time>${fmtLogin(l.created_at)}</time>
      ${esc(l.email || "admin")}
    </li>`).join("");
}

function setSection(name) {
  state.section = name;
  $$(".admin-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === name);
  });
  const meta = SECTION_META[name] || SECTION_META.overview;
  $("#adminPageTitle").textContent = meta.title;
  $("#adminPageSub").textContent   = meta.sub;
  $("#adminSidebar")?.classList.remove("open");

  const needsActivity  = ["ai", "users", "courier"].includes(name);
  const needsWarehouses = ["warehouses", "depot-create"].includes(name);
  const needsMoving    = name === "nakliyat" || name === "nakliyeci-create";
  const needsKurye     = name === "kurye-create";

  const loaders = [];
  if (needsActivity)  loaders.push(ensureActivity());
  if (needsWarehouses) loaders.push(ensureWarehouses());
  if (needsMoving)    loaders.push(loadMovingData());
  if (needsKurye)     loaders.push(loadKuryeData());

  if (loaders.length) {
    Promise.all(loaders).then(() => renderSection()).catch(() => renderSection());
  } else {
    renderSection();
  }
}

async function loadAll() {
  // Sadece dashboard istatistiklerini yükle (overview için yeterli)
  const dash = await apiFetch("/api/admin/dashboard");
  state.stats    = dash.stats    || {};
  state.analytics = dash.analytics || state.analytics;
  state.logins   = dash.logins   || [];
  renderLoginLog();
}

// Depolar sadece warehouses/depot-create sekmesinde yüklenir
async function ensureWarehouses() {
  if (state.warehouses.length) return;
  try {
    const res = await apiFetch("/api/admin/warehouses");
    state.warehouses = res.warehouses || [];
  } catch { state.warehouses = []; }
}

// Activity sadece ilgili sekme açılınca yüklenir
async function ensureActivity() {
  if (state.activityLoaded) return;
  try {
    state.activity = await apiFetch("/api/admin/activity");
    state.activityLoaded = true;
  } catch { state.activity = {}; }
}

async function loadMovingData() {
  try {
    const res = await apiFetch("/api/moving/admin/list");
    state.movingOrders = res.orders || [];
  } catch { state.movingOrders = []; }
  try {
    const res = await apiFetch("/api/admin/branches");
    state.nakliyeciler = (res.branches || []).filter(b => b.branch_type === "moving");
  } catch { state.nakliyeciler = []; }
}

async function loadWarehouseDetail(id) {
  state.selectedWarehouseId = id;
  state.whTab = "products";
  const res = await apiFetch(`/api/admin/warehouses/${encodeURIComponent(id)}`);
  state.warehouseDetail = res;
  renderSection();
}

function renderSection() {
  const box = $("#adminContent");
  if (!box) return;
  box.classList.remove("admin-section-enter");
  void box.offsetWidth;
  box.classList.add("admin-section-enter");

  const renderers = {
    overview: renderOverview,
    "depot-create": renderDepotCreate,
    warehouses: renderWarehouses,
    ai: renderAi,
    users: renderUsers,
    courier: renderCourier,
    nakliyat: renderNakliyat,
    "nakliyeci-create": renderNakliyeciCreate,
    "kurye-create": renderKuryeCreate,
  };
  box.innerHTML = (renderers[state.section] || renderOverview)();
  bindSectionEvents();
}

function maxOf(arr) {
  return Math.max(1, ...(arr || [0]));
}

function renderBarChart(labels, values, color = "linear-gradient(180deg, #3b82f6, #1d4ed8)") {
  const max = maxOf(values);
  return `
    <div class="admin-bar-chart">
      ${labels.map((lbl, i) => {
        const v = values[i] || 0;
        const h = Math.round((v / max) * 130);
        return `
          <div class="admin-bar-col">
            <span class="admin-bar-val">${v}</span>
            <div class="admin-bar" style="height:${h}px;background:${color}"></div>
            <span>${esc(lbl)}</span>
          </div>`;
      }).join("")}
    </div>`;
}

function renderDonut(ai, courier, warehouse) {
  const total = ai + courier + warehouse || 1;
  const pAi = Math.round((ai / total) * 100);
  const pCo = Math.round((courier / total) * 100);
  const pWh = 100 - pAi - pCo;
  const bg = `conic-gradient(#3b82f6 0% ${pAi}%, #10b981 ${pAi}% ${pAi + pCo}%, #f59e0b ${pAi + pCo}% 100%)`;
  return `
    <div class="admin-donut-wrap">
      <div class="admin-donut" style="background:${bg}">
        <div class="admin-donut-inner">${total}</div>
      </div>
      <div class="admin-donut-legend">
        <div class="admin-legend-item"><span class="admin-legend-dot" style="background:#3b82f6"></span> AI — ${pAi}%</div>
        <div class="admin-legend-item"><span class="admin-legend-dot" style="background:#10b981"></span> Kurye — ${pCo}%</div>
        <div class="admin-legend-item"><span class="admin-legend-dot" style="background:#f59e0b"></span> Depo — ${pWh}%</div>
      </div>
    </div>`;
}

function renderOverview() {
  const s = state.stats;
  const a = state.analytics;
  const sumAi = (a.weeklyAi || []).reduce((n, v) => n + v, 0);
  const sumCo = (a.weeklyCourier || []).reduce((n, v) => n + v, 0);
  const sumWh = (a.weeklyWarehouse || []).reduce((n, v) => n + v, 0);

  const recent = [
    ...(state.activity.courierOrders || []).slice(0, 4).map((o) => ({
      type: "Kurye", tag: "admin-tag--green",
      text: `${o.sender_name || "—"} → ${o.recipient_name || "—"}`,
      date: o.created_at,
    })),
    ...(state.activity.warehouseBookings || []).slice(0, 4).map((b) => ({
      type: "Depo", tag: "admin-tag--blue",
      text: b.warehouse_name || b.warehouse_id || "Depo kiralama",
      date: b.created_at,
    })),
    ...(state.activity.analyses || []).slice(0, 4).map((x) => ({
      type: "AI", tag: "admin-tag--warn",
      text: x.product_name || "Analiz",
      date: x.created_at,
    })),
  ].sort((x, y) => new Date(y.date) - new Date(x.date)).slice(0, 8);

  const whCount = state.warehouses.length;
  const filledWh = state.warehouses.filter((w) => w.productCount > 0).length;
  const totalProducts = state.warehouses.reduce((n, w) => n + w.productCount, 0);

  return `
    <div class="admin-hero-stats">
      <div class="admin-hero-stat admin-hero-stat--blue">
        <strong>${s.users ?? 0}</strong>
        <span>Kullanıcı</span>
        <small>Toplam kayıtlı</small>
      </div>
      <div class="admin-hero-stat admin-hero-stat--purple">
        <strong>${s.analyses ?? 0}</strong>
        <span>AI Analiz</span>
        <small>Bugün: ${s.aiToday ?? 0}</small>
      </div>
      <div class="admin-hero-stat admin-hero-stat--green">
        <strong>${s.courierOrders ?? 0}</strong>
        <span>Kurye Sipariş</span>
        <small>Ödenen: ${s.activeCouriers ?? 0}</small>
      </div>
      <div class="admin-hero-stat admin-hero-stat--orange">
        <strong>${s.warehouseBookings ?? 0}</strong>
        <span>Depo Kiralama</span>
        <small>Ödenen: ${s.paidWarehouses ?? 0}</small>
      </div>
    </div>

    <div class="admin-charts-row">
      <div class="admin-chart-card">
        <h3>Son 7 Gün — Platform Aktivitesi</h3>
        ${renderBarChart(
          a.labels || [],
          (a.weeklyAi || []).map((v, i) => v + (a.weeklyCourier?.[i] || 0) + (a.weeklyWarehouse?.[i] || 0)),
          "linear-gradient(180deg, #6366f1, #4338ca)"
        )}
      </div>
      <div class="admin-chart-card">
        <h3>Haftalık Dağılım</h3>
        ${renderDonut(sumAi, sumCo, sumWh)}
      </div>
    </div>

    <div class="admin-charts-row">
      <div class="admin-chart-card">
        <h3>AI Analiz (7 gün)</h3>
        ${renderBarChart(a.labels || [], a.weeklyAi || [], "linear-gradient(180deg, #8b5cf6, #6d28d9)")}
      </div>
      <div class="admin-chart-card">
        <h3>Kurye & Depo (7 gün)</h3>
        ${renderBarChart(
          a.labels || [],
          (a.weeklyCourier || []).map((v, i) => v + (a.weeklyWarehouse?.[i] || 0)),
          "linear-gradient(180deg, #10b981, #059669)"
        )}
      </div>
    </div>

    <div class="admin-charts-row" style="grid-template-columns:1fr 1fr">
      <div class="admin-card admin-card-pad">
        <div class="admin-card-head"><h3>Son Aktiviteler</h3></div>
        ${recent.length ? tableWrap(["Tür", "İşlem", "Tarih"], recent.map((r) => `
          <tr>
            <td><span class="admin-tag ${r.tag}">${esc(r.type)}</span></td>
            <td>${esc(r.text)}</td>
            <td>${fmtDate(r.date)}</td>
          </tr>`)) : `<p class="admin-empty">Henüz aktivite yok.</p>`}
      </div>
      <div class="admin-card admin-card-pad">
        <div class="admin-card-head"><h3>Depo Özeti</h3></div>
        <div class="admin-hero-stats" style="grid-template-columns:1fr 1fr;margin-bottom:0">
          <div class="admin-hero-stat admin-hero-stat--blue" style="padding:16px">
            <strong>${whCount}</strong><span>Aktif Depo</span>
          </div>
          <div class="admin-hero-stat admin-hero-stat--green" style="padding:16px">
            <strong>${filledWh}</strong><span>Dolu Depo</span>
          </div>
          <div class="admin-hero-stat admin-hero-stat--orange" style="padding:16px">
            <strong>${totalProducts}</strong><span>Toplam Ürün</span>
          </div>
          <div class="admin-hero-stat admin-hero-stat--purple" style="padding:16px">
            <strong>${state.warehouses.reduce((n, w) => n + w.staffCount, 0)}</strong><span>Depo Yetkilisi</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderDepotCreate() {
  const dbList = state.warehouses.filter((w) => w.fromDb);
  return `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head">
        <h3>Yeni Depo Oluştur</h3>
      </div>
      <form id="depotForm" class="admin-form-grid">
        <div class="field"><label for="d_name">Depo adı *</label>
          <input class="input" id="d_name" required placeholder="Kadıköy Merkez Depo" /></div>
        <div class="field"><label for="d_code">Depo kodu</label>
          <input class="input" id="d_code" placeholder="ist-kadikoy-1 (boş bırakılırsa otomatik)" /></div>
        <div class="field"><label for="d_city">Şehir *</label>
          <input class="input" id="d_city" required value="İstanbul" /></div>
        <div class="field"><label for="d_district">İlçe</label>
          <input class="input" id="d_district" placeholder="Kadıköy" /></div>
        <div class="field field-full"><label for="d_address">Adres / Konum *</label>
          <input class="input" id="d_address" required placeholder="Caferağa Mah. Moda Cad. No:12" /></div>
        <div class="field"><label for="d_lat">Enlem (lat)</label>
          <input class="input" id="d_lat" type="number" step="any" placeholder="40.9876" /></div>
        <div class="field"><label for="d_lng">Boylam (lng)</label>
          <input class="input" id="d_lng" type="number" step="any" placeholder="29.0234" /></div>
        <div class="field"><label for="d_area">Alan (m²)</label>
          <input class="input" id="d_area" type="number" min="1" value="500" /></div>
        <div class="field"><label for="d_type">Depo tipi</label>
          <select class="input" id="d_type">
            <option value="standard">Standart</option>
            <option value="cold">Soğuk Hava</option>
            <option value="secure">Yüksek Güvenlik</option>
          </select></div>
        <div class="field"><label for="d_price">Aylık fiyat (₺)</label>
          <input class="input" id="d_price" type="number" min="0" value="150" /></div>
        <button class="btn btn-primary" type="submit">Depo Oluştur</button>
      </form>
    </div>
    ${dbList.length ? `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head"><h3>Veritabanından Eklenen Depolar (${dbList.length})</h3></div>
      ${tableWrap(["Kod", "Ad", "Konum", "Alan", "Tip"], dbList.map((w) => `
        <tr>
          <td><span class="admin-tag admin-tag--blue">${esc(w.id)}</span></td>
          <td>${esc(w.name)}</td>
          <td>${esc(w.district || "—")}, ${esc(w.address || "—")}</td>
          <td>${w.area_sqm || "—"} m²</td>
          <td>${esc(w.type || "standard")}</td>
        </tr>`))}
    </div>` : ""}`;
}

function filteredWarehouses() {
  const q = state.whSearch.trim().toLowerCase();
  if (!q) return state.warehouses;
  return state.warehouses.filter((w) =>
    [w.id, w.name, w.district, w.city, w.address, w.type]
      .some((f) => String(f || "").toLowerCase().includes(q))
  );
}

function renderWarehouses() {
  const list = filteredWarehouses();
  const selectedId = state.selectedWarehouseId;
  const detail = state.warehouseDetail;

  const tableRows = list.map((w) => `
    <tr class="${selectedId === w.id ? "selected" : ""}" data-wh-id="${esc(w.id)}">
      <td><strong>${esc(w.name)}</strong><br><span class="admin-tag admin-tag--gray">${esc(w.id)}</span></td>
      <td>${esc(w.district || "—")}<br><small class="muted">${esc(w.address || "—")}</small></td>
      <td><span class="admin-tag admin-tag--green">${w.productCount} ürün</span></td>
      <td><span class="admin-tag admin-tag--blue">${w.staffCount} yetkili</span></td>
      <td>${w.available_sqm ?? "—"}/${w.area_sqm ?? "—"} m²</td>
      <td>${esc(w.type || "—")}</td>
    </tr>`).join("");

  const detailPanel = detail?.warehouse
    ? renderWarehouseDetailPanel(detail)
    : `<div class="admin-wh-detail-panel">
        <div class="admin-wh-detail-head"><h3>Depo Seçin</h3><p>Listeden bir depo satırına tıklayın</p></div>
        <div class="admin-empty">Detay paneli burada görünecek</div>
      </div>`;

  return `
    <div class="admin-wh-toolbar">
      <input class="input" id="whSearch" type="search" placeholder="Depo ara (ad, ilçe, kod…)" value="${esc(state.whSearch)}" />
      <span class="admin-tag admin-tag--gray">${list.length} depo</span>
    </div>
    <div class="admin-wh-split">
      <div class="admin-card">
        <div class="admin-table-wrap" style="border:none;border-radius:16px">
          <table class="admin-table">
            <thead><tr>
              <th>Depo</th><th>Konum</th><th>Stok</th><th>Yetkili</th><th>Alan</th><th>Tip</th>
            </tr></thead>
            <tbody>${tableRows || `<tr><td colspan="6"><p class="admin-empty">Depo bulunamadı.</p></td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${detailPanel}
    </div>`;
}

function renderWarehouseDetailPanel(data) {
  const w = data.warehouse;
  const products = data.products || [];
  const staff = data.staff || [];
  const tab = state.whTab;

  return `
    <div class="admin-wh-detail-panel">
      <div class="admin-wh-detail-head">
        <h3>${esc(w.name)}</h3>
        <p>${esc(w.district || w.city || "—")} · ${esc(w.address || "Adres yok")}</p>
        ${w.lat && w.lng ? `<p style="margin-top:6px;font-size:11px;opacity:.6">${w.lat}, ${w.lng}</p>` : ""}
      </div>
      <div class="admin-wh-tabs">
        <button class="admin-wh-tab${tab === "products" ? " active" : ""}" type="button" data-wh-tab="products">Ürünler (${products.length})</button>
        <button class="admin-wh-tab${tab === "staff" ? " active" : ""}" type="button" data-wh-tab="staff">Yetkililer (${staff.length})</button>
      </div>
      <div class="admin-wh-detail-body">
        <div class="admin-wh-tab-pane${tab === "products" ? " active" : ""}" id="whTabProducts">
          ${products.length ? products.map((p) => renderProductItem(p)).join("") : `<p class="admin-empty" style="padding:24px">Bu depoda ürün yok.</p>`}
        </div>
        <div class="admin-wh-tab-pane${tab === "staff" ? " active" : ""}" id="whTabStaff">
          <div style="padding:16px 18px 0">
            <form id="whStaffForm">
              <input type="hidden" id="wh_id" value="${esc(w.id)}" />
              <div class="admin-form-grid" style="grid-template-columns:1fr">
                <div class="field"><label for="wh_email">E-posta</label>
                  <input class="input" id="wh_email" type="email" required placeholder="depo@kargotigo.com" /></div>
                <div class="field"><label for="wh_password">Şifre</label>
                  <input class="input" id="wh_password" type="password" minlength="6" required /></div>
                <div class="field"><label for="wh_name">Yetkili adı</label>
                  <input class="input" id="wh_name" placeholder="${esc(w.district)} Depo Yetkilisi" /></div>
                <button class="btn btn-primary btn-sm" type="submit">Yetkili Ekle</button>
              </div>
            </form>
          </div>
          <div style="padding:16px 18px">
            ${staff.length ? staff.map((s) => `
              <div class="admin-staff-chip">
                <div><strong>${esc(s.branch_name)}</strong><br><span class="muted">${esc(s.username)}</span></div>
                <span class="admin-tag ${s.active ? "admin-tag--green" : "admin-tag--gray"}">${s.active ? "Aktif" : "Pasif"}</span>
              </div>`).join("") : `<p class="muted">Henüz yetkili atanmadı.</p>`}
          </div>
        </div>
      </div>
    </div>`;
}

function renderProductItem(p) {
  const customer = [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
  const dims = p.length_cm && p.width_cm && p.height_cm
    ? `${p.length_cm} × ${p.width_cm} × ${p.height_cm} cm`
    : "—";
  return `
    <details class="admin-product-row">
      <summary>
        <span>${esc(customer)} · ${p.weight_kg || "—"} kg · ${p.area_sqm || "—"} m²</span>
        <span class="admin-tag admin-tag--green">${fmtMoney(p.total_price) || "—"}</span>
      </summary>
      <dl class="admin-product-grid">
        <div><dt>Müşteri</dt><dd>${esc(customer)}</dd></div>
        <div><dt>İletişim</dt><dd>${esc(p.email || "—")}<br>${esc(p.contact_phone || "—")}</dd></div>
        <div><dt>Ağırlık</dt><dd>${p.weight_kg || "—"} kg</dd></div>
        <div><dt>Boyut</dt><dd>${esc(dims)}</dd></div>
        <div><dt>Depolama</dt><dd>${p.area_sqm || "—"} m² · ${p.storage_days || "—"} gün</dd></div>
        <div><dt>Şifreler</dt><dd>Giriş: ${esc(p.entry_password || "—")}<br>Çıkış: ${esc(p.exit_password || "—")}</dd></div>
        <div><dt>Adres</dt><dd>${esc(p.user_address || p.personal_address || "—")}</dd></div>
        <div><dt>Ödeme</dt><dd>${esc(p.invoice_no || "—")} · <span class="admin-tag admin-tag--blue">${esc(p.payment_status)}</span></dd></div>
        <div><dt>Kayıt</dt><dd>${fmtDate(p.created_at)}</dd></div>
        ${p.notes ? `<div style="grid-column:1/-1"><dt>Not</dt><dd>${esc(p.notes)}</dd></div>` : ""}
      </dl>
    </details>`;
}

function renderAi() {
  const rows = (state.activity.analyses || []).map((a) => `
    <tr>
      <td>${esc(a.product_name || "—")}</td>
      <td>${esc(a.brand || "—")}</td>
      <td>${a.weight_kg ? a.weight_kg + " kg" : "—"}</td>
      <td>${esc(a.user_name || "—")}</td>
      <td>${fmtDate(a.created_at)}</td>
    </tr>`);
  return `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head"><h3>AI Fotoğraf Analizleri (${rows.length})</h3></div>
      ${tableWrap(["Ürün", "Marka", "Kg", "Kullanıcı", "Tarih"], rows)}
    </div>`;
}

function renderUsers() {
  const rows = (state.activity.users || []).map((u) => {
    const isAdmin = u.role === "admin" || u.email === "admin@kargotigo.com";
    const action = isAdmin
      ? '<span class="admin-muted">—</span>'
      : `<button class="admin-del-btn" data-del-user="${esc(u.id)}" data-del-name="${esc(u.full_name || u.email)}">Sil</button>`;
    return `
    <tr>
      <td>${esc(u.full_name || "—")}</td>
      <td>${esc(u.email)}</td>
      <td><span class="admin-tag admin-tag--gray">${esc(u.role || "user")}</span></td>
      <td>${u.is_premium ? '<span class="admin-tag admin-tag--green">Evet</span>' : "Hayır"}</td>
      <td>${fmtDate(u.created_at)}</td>
      <td>${action}</td>
    </tr>`;
  });
  return `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head"><h3>Kayıtlı Kullanıcılar (${rows.length})</h3></div>
      ${tableWrap(["Ad Soyad", "E-posta", "Rol", "Premium", "Kayıt", "İşlem"], rows)}
    </div>`;
}

function renderCourier() {
  const rows = (state.activity.courierOrders || []).map((o) => `
    <tr>
      <td><span class="admin-tag admin-tag--gray">${esc(o.tracking_number || o.id?.slice(0, 8) || "—")}</span></td>
      <td>${esc(o.sender_name || "—")}<br><small class="muted">→ ${esc(o.recipient_name || "—")}</small></td>
      <td>
        <div class="admin-courier-loc">
          <strong>Alım</strong>${esc(o.pickup_address || o.origin_city || "—")}
        </div>
      </td>
      <td>
        <div class="admin-courier-loc">
          <strong>Teslim</strong>${esc(o.delivery_address || o.destination_city || "—")}
        </div>
      </td>
      <td>${o.weight_kg ? o.weight_kg + " kg" : "—"}</td>
      <td>${fmtMoney(o.price)}</td>
      <td><span class="admin-tag admin-tag--blue">${esc(o.payment_status)}</span><br><span class="admin-tag admin-tag--green">${esc(o.status)}</span></td>
      <td>${fmtDate(o.created_at)}</td>
    </tr>`);
  return `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head"><h3>Günlük Kurye Siparişleri (${rows.length})</h3></div>
      ${tableWrap(["Takip", "Gönderen → Alıcı", "Alım Yeri", "Teslim Yeri", "Kg", "Tutar", "Durum", "Tarih"], rows)}
    </div>`;
}

function renderNakliyat() {
  const MOVING_TYPE = { ev: "Ev Taşıma", ofis: "Ofis Taşıma" };
  const STATUS_MAP = {
    pending_payment: "Ödeme Bekleniyor", paid: "Ödendi", assigned: "Atandı",
    in_progress: "Devam Ediyor", completed: "Tamamlandı", cancelled: "İptal",
  };

  const rows = state.movingOrders.map(o => {
    const nakliyeciOpts = state.nakliyeciler.map(n =>
      `<option value="${esc(n.id)}"${o.assigned_to === n.id ? " selected" : ""}>${esc(n.branch_name)}</option>`
    ).join("");
    return `
      <tr>
        <td>${esc(MOVING_TYPE[o.moving_type] || o.moving_type)} / ${esc(o.room_size)}</td>
        <td>${esc(o.contact_name || "—")}<br><small>${esc(o.contact_phone || "")}</small></td>
        <td><small>${esc(o.origin_address || "—")}</small></td>
        <td><small>${esc(o.dest_address || "—")}</small></td>
        <td>${fmtMoney(o.price)}</td>
        <td><span class="admin-tag admin-tag--blue">${esc(STATUS_MAP[o.status] || o.status)}</span></td>
        <td>
          ${o.status === "paid" || o.status === "assigned" ? `
            <div class="admin-assign-row">
              <select class="input input-sm" id="assign_select_${esc(o.id)}">
                <option value="">Nakliyeci Seç</option>
                ${nakliyeciOpts}
              </select>
              <button class="btn btn-primary btn-sm nakl-assign-btn" data-order-id="${esc(o.id)}" type="button">Ata</button>
            </div>` : "—"}
        </td>
        <td>${fmtDate(o.created_at)}</td>
      </tr>`;
  });

  return `
    <div class="admin-card admin-card-pad">
      <div class="admin-card-head">
        <h3>Nakliyat Siparişleri (${rows.length})</h3>
        <button class="btn btn-sm btn-outline" id="refreshMoving" type="button">Yenile</button>
      </div>
      ${tableWrap(["Tür / Oda", "Müşteri", "Mevcut Adres", "Yeni Adres", "Fiyat", "Durum", "Nakliyeci Ata", "Tarih"], rows)}
    </div>`;
}

function renderNakliyeciCreate() {
  const rows = state.nakliyeciler.map(n => `
    <tr>
      <td>${esc(n.branch_name)}</td>
      <td>${esc(n.username)}</td>
      <td><span class="admin-tag ${n.active ? "admin-tag--green" : "admin-tag--gray"}">${n.active ? "Aktif" : "Pasif"}</span></td>
      <td>${fmtDate(n.created_at)}</td>
    </tr>`);

  return `
    <div class="admin-card admin-card-pad" style="max-width:520px">
      <div class="admin-card-head"><h3>Yeni Nakliyeci Hesabı</h3></div>
      <form id="nakliyeciForm" class="admin-form">
        <div class="field"><label>Ad Soyad / Şirket Adı</label><input class="input" id="nakl_name" placeholder="Nakliyeci Adı" required /></div>
        <div class="field"><label>E-posta</label><input class="input" id="nakl_email" type="email" placeholder="nakliyeci@ornek.com" required /></div>
        <div class="field"><label>Şifre</label><input class="input" id="nakl_password" type="password" placeholder="En az 6 karakter" required /></div>
        <button class="btn btn-primary" type="submit">Nakliyeci Hesabı Oluştur</button>
      </form>
    </div>
    <div class="admin-card admin-card-pad" style="margin-top:24px">
      <div class="admin-card-head"><h3>Mevcut Nakliyeciler (${rows.length})</h3></div>
      ${tableWrap(["Ad", "E-posta", "Durum", "Oluşturulma"], rows)}
    </div>`;
}

function bindSectionEvents() {
  $$("[data-wh-id]").forEach((row) => {
    row.addEventListener("click", () => loadWarehouseDetail(row.dataset.whId));
  });

  $$("[data-wh-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.whTab = btn.dataset.whTab;
      renderSection();
    });
  });

  $("#whSearch")?.addEventListener("input", (e) => {
    state.whSearch = e.target.value;
    renderSection();
    const inp = $("#whSearch");
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  });

  $("#depotForm")?.addEventListener("submit", onCreateDepot);
  $("#whStaffForm")?.addEventListener("submit", onAssignWarehouseStaff);
  $("#nakliyeciForm")?.addEventListener("submit", onCreateNakliyeci);
  $$(".nakl-assign-btn").forEach(btn => btn.addEventListener("click", () => onAssignNakliyeci(btn)));
  $("#refreshMoving")?.addEventListener("click", async () => { await loadMovingData(); renderSection(); });
  $("#kuryeForm")?.addEventListener("submit", onCreateKurye);
  $$(".kurye-assign-btn").forEach(btn => btn.addEventListener("click", () => onAssignKurye(btn)));
  $("#refreshCourierAdmin")?.addEventListener("click", async () => { await loadKuryeData(); renderSection(); });

  $$("[data-del-user]").forEach((btn) => btn.addEventListener("click", () => onDeleteUser(btn)));
}

async function onDeleteUser(btn) {
  const id = btn.dataset.delUser;
  const name = btn.dataset.delName || "bu kullanıcı";
  if (!confirm(`"${name}" kalıcı olarak silinecek.\nBu kullanıcıya bağlı tüm kayıtlar (siparişler, analizler, şube hesabı vb.) da silinir.\n\nDevam edilsin mi?`)) return;
  btn.disabled = true;
  btn.textContent = "Siliniyor…";
  try {
    await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.activity = await apiFetch("/api/admin/activity");
    renderSection();
  } catch (e) {
    alert(e.message || "Kullanıcı silinemedi.");
    btn.disabled = false;
    btn.textContent = "Sil";
  }
}

async function onCreateDepot(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);
  try {
    await apiFetch("/api/admin/warehouses", {
      method: "POST",
      body: {
        name: $("#d_name").value.trim(),
        code: $("#d_code").value.trim() || undefined,
        city: $("#d_city").value.trim(),
        district: $("#d_district").value.trim() || undefined,
        address: $("#d_address").value.trim(),
        lat: $("#d_lat").value ? Number($("#d_lat").value) : undefined,
        lng: $("#d_lng").value ? Number($("#d_lng").value) : undefined,
        areaSqm: Number($("#d_area").value) || 500,
        availableSqm: Number($("#d_area").value) || 500,
        type: $("#d_type").value,
        priceMonthly: Number($("#d_price").value) || 150,
      },
    });
    toast("Depo oluşturuldu.", "ok");
    e.target.reset();
    $("#d_city").value = "İstanbul";
    $("#d_area").value = "500";
    $("#d_price").value = "150";
    const whRes = await apiFetch("/api/admin/warehouses");
    state.warehouses = whRes.warehouses || [];
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Depo Oluştur");
  }
}

async function onAssignWarehouseStaff(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);
  try {
    const warehouseId = $("#wh_id").value;
    await apiFetch("/api/admin/warehouses/staff", {
      method: "POST",
      body: {
        warehouseId,
        email: $("#wh_email").value.trim(),
        password: $("#wh_password").value,
        branchName: $("#wh_name").value.trim() || undefined,
      },
    });
    toast("Depo yetkilisi eklendi.", "ok");
    e.target.reset();
    $("#wh_id").value = warehouseId;
    const [whRes, detail] = await Promise.all([
      apiFetch("/api/admin/warehouses"),
      apiFetch(`/api/admin/warehouses/${encodeURIComponent(warehouseId)}`),
    ]);
    state.warehouses = whRes.warehouses || [];
    state.warehouseDetail = detail;
    state.whTab = "staff";
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Yetkili Ekle");
  }
}

async function onCreateNakliyeci(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);
  try {
    await apiFetch("/api/admin/branches", {
      method: "POST",
      body: {
        branchName: $("#nakl_name").value.trim(),
        email: $("#nakl_email").value.trim(),
        password: $("#nakl_password").value,
        branchType: "moving",
      },
    });
    toast("Nakliyeci hesabı oluşturuldu.", "ok");
    e.target.reset();
    await loadMovingData();
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Nakliyeci Hesabı Oluştur");
  }
}

async function onAssignNakliyeci(btn) {
  const orderId = btn.dataset.orderId;
  const select = $(`#assign_select_${orderId}`);
  const nakliyeciAccountId = select?.value;
  if (!nakliyeciAccountId) { toast("Nakliyeci seçin.", "err"); return; }
  setLoading(btn, true);
  try {
    await apiFetch("/api/moving/admin/assign", {
      method: "POST",
      body: { orderId, nakliyeciAccountId },
    });
    toast("Nakliyeci atandı.", "ok");
    await loadMovingData();
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ata");
  }
}

async function loadKuryeData() {
  try {
    const res = await apiFetch("/api/admin/branches");
    state.kuryeler = (res.branches || []).filter(b => b.branch_type === "courier_worker");
  } catch { state.kuryeler = []; }
  try {
    const res = await apiFetch("/api/admin/activity");
    state.courierOrdersAdmin = res.courierOrders || [];
  } catch { state.courierOrdersAdmin = []; }
}

function renderKuryeCreate() {
  const STATUS = {
    pending_payment: "Ödeme Bekleniyor", order_received: "Sipariş Alındı",
    picked_up: "Yolda", delivered: "Teslim Edildi",
  };
  const kurye = state.kuryeler;
  const orders = state.courierOrdersAdmin.filter(o => o.payment_status === "paid");

  const staffRows = kurye.map(k => `
    <tr>
      <td>${esc(k.branch_name)}</td>
      <td>${esc(k.username)}</td>
      <td><span class="admin-tag ${k.active ? "admin-tag--green" : "admin-tag--gray"}">${k.active ? "Aktif" : "Pasif"}</span></td>
      <td>${fmtDate(k.created_at)}</td>
    </tr>`);

  const orderRows = orders.map(o => {
    const kuryeOpts = kurye.map(k =>
      `<option value="${esc(k.id)}"${o.assigned_courier === k.id ? " selected" : ""}>${esc(k.branch_name)}</option>`
    ).join("");
    return `
      <tr>
        <td><small>${esc(o.tracking_number || o.id?.slice(0, 10) || "—")}</small></td>
        <td>${esc(o.sender_name || "—")}<br><small class="muted">→ ${esc(o.recipient_name || "—")}</small></td>
        <td><small>${esc(o.pickup_address?.split(" —")[0] || "—")}</small></td>
        <td>${fmtMoney(o.price)}</td>
        <td><span class="admin-tag admin-tag--blue">${esc(STATUS[o.status] || o.status)}</span></td>
        <td>
          <div class="admin-assign-row">
            <select class="input input-sm" id="kurye_sel_${esc(o.id)}">
              <option value="">Kurye Seç</option>
              ${kuryeOpts}
            </select>
            <button class="btn btn-primary btn-sm kurye-assign-btn" data-order-id="${esc(o.id)}" type="button">Ata</button>
          </div>
        </td>
        <td>${fmtDate(o.created_at)}</td>
      </tr>`;
  });

  return `
    <div class="admin-card admin-card-pad" style="max-width:520px">
      <div class="admin-card-head"><h3>Yeni Kurye Hesabı</h3></div>
      <form id="kuryeForm" class="admin-form">
        <div class="field"><label>Ad Soyad</label><input class="input" id="kurye_name" placeholder="Kurye Adı" required /></div>
        <div class="field"><label>E-posta</label><input class="input" id="kurye_email" type="email" placeholder="kurye@kargotigo.com" required /></div>
        <div class="field"><label>Şifre</label><input class="input" id="kurye_password" type="password" placeholder="En az 6 karakter" required /></div>
        <div class="field"><label>Telefon <span class="muted">(opsiyonel)</span></label><input class="input" id="kurye_phone" type="tel" maxlength="11" placeholder="05XX XXX XX XX" /></div>
        <button class="btn btn-primary" type="submit">Kurye Hesabı Oluştur</button>
      </form>
    </div>
    <div class="admin-card admin-card-pad" style="margin-top:24px">
      <div class="admin-card-head"><h3>Mevcut Kuryeler (${kurye.length})</h3></div>
      ${tableWrap(["Ad", "E-posta", "Durum", "Oluşturulma"], staffRows)}
    </div>
    <div class="admin-card admin-card-pad" style="margin-top:24px">
      <div class="admin-card-head">
        <h3>Kurye Siparişleri (${orders.length})</h3>
        <button class="btn btn-sm btn-outline" id="refreshCourierAdmin" type="button">Yenile</button>
      </div>
      ${tableWrap(["Takip", "Gönderen → Alıcı", "Alım Yeri", "Fiyat", "Durum", "Kurye Ata", "Tarih"], orderRows)}
    </div>`;
}

async function onCreateKurye(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);
  try {
    await apiFetch("/api/admin/branches", {
      method: "POST",
      body: {
        branchName: $("#kurye_name").value.trim(),
        email: $("#kurye_email").value.trim(),
        password: $("#kurye_password").value,
        branchType: "courier_worker",
        contactPhone: $("#kurye_phone")?.value.trim() || null,
      },
    });
    toast("Kurye hesabı oluşturuldu.", "ok");
    e.target.reset();
    await loadKuryeData();
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Kurye Hesabı Oluştur");
  }
}

async function onAssignKurye(btn) {
  const orderId = btn.dataset.orderId;
  const select = $(`#kurye_sel_${orderId}`);
  const kuryeAccountId = select?.value;
  if (!kuryeAccountId) { toast("Kurye seçin.", "err"); return; }
  setLoading(btn, true);
  try {
    // Update courier_orders assigned_courier field
    await apiFetch(`/api/courier/admin/assign`, {
      method: "POST",
      body: { orderId, kuryeAccountId },
    });
    toast("Kurye atandı.", "ok");
    await loadKuryeData();
    renderSection();
  } catch (err) {
    toast(err.message, "err");
  } finally {
    setLoading(btn, false, "Ata");
  }
}

async function init() {
  await verifySession();
  if (redirectIfWrongAppPage(getUser())) return;

  const user = getUser();
  if (resolveUserRole(user) !== "admin") {
    $("#adminDenied")?.classList.remove("hidden");
    return;
  }

  $("#adminApp")?.classList.remove("hidden");
  $("#adminUserLabel").textContent = getDisplayName(user) || user.email || "Admin";
  $("#adminLogout")?.addEventListener("click", logout);

  $$(".admin-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => setSection(btn.dataset.section));
  });
  $("#adminMenuToggle")?.addEventListener("click", () => {
    $("#adminSidebar")?.classList.toggle("open");
  });

  // Sayfayı hemen göster, veri arka planda yüklenir
  $("#adminLoading")?.classList.add("hidden");
  setSection("overview");

  loadAll()
    .then(() => {
      if (state.section === "overview") renderSection();
    })
    .catch((e) => {
      if (e.status === 403) {
        $("#adminDenied")?.classList.remove("hidden");
        $("#adminApp")?.classList.add("hidden");
        return;
      }
      toast(e.message || "Veri yüklenemedi.", "err");
    });
}

init();
