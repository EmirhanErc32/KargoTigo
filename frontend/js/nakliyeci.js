import { $, $$, toast, setLoading } from "./ui.js";
import { apiFetch } from "./api.js";
import { requireLogin, verifySession, getUser, logout } from "./auth.js";

if (!requireLogin()) throw new Error("yonlendiriliyor");

let state = {
  tab: "active",
  orders: [],
  account: null,
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

function esc(s = "") {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtMoney(v) {
  if (v == null) return "—";
  try { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v); }
  catch { return v + " TL"; }
}

const MOVING_TYPE = { ev: "Ev Taşıma", ofis: "Ofis Taşıma" };
const FLOOR_LABEL = {
  "giris": "Giriş Kat",
  "1-4-asansorlu": "1-4. Kat (Asansörlü)",
  "1-4-asansorsuz": "1-4. Kat (Asansörsüz)",
  "5-asansorlu": "5. Kat+ (Asansörlü)",
  "5-asansorsuz": "5. Kat+ (Asansörsüz)",
};
const PACK_LABEL = { yok: "Paketleme Yok", buyuk: "Büyük Eşya", tam: "Tam Paketleme" };

function activeOrders()    { return state.orders.filter(o => o.status !== "completed" && o.status !== "cancelled"); }
function completedOrders() { return state.orders.filter(o => o.status === "completed"); }

function renderStats() {
  const box = $("#naklStats");
  if (!box) return;
  const active = activeOrders().length;
  const done   = completedOrders().length;
  box.innerHTML = `
    <div class="panel-stat panel-stat--warn">
      <div class="panel-stat-icon">🚚</div>
      <div class="panel-stat-body"><strong>${active}</strong><span>Aktif İş</span></div>
    </div>
    <div class="panel-stat panel-stat--green">
      <div class="panel-stat-icon">✅</div>
      <div class="panel-stat-body"><strong>${done}</strong><span>Tamamlanan</span></div>
    </div>
    <div class="panel-stat panel-stat--blue">
      <div class="panel-stat-icon">📋</div>
      <div class="panel-stat-body"><strong>${state.orders.length}</strong><span>Toplam</span></div>
    </div>`;
}

function renderTabs() {
  const box = $("#naklTabs");
  if (!box) return;
  const tabs = [
    { id: "active",    icon: "🚚", label: "Aktif İşler",   count: activeOrders().length },
    { id: "completed", icon: "✅", label: "Tamamlananlar", count: completedOrders().length },
  ];
  box.innerHTML = tabs.map(t => `
    <button class="panel-tab branch-tab${state.tab === t.id ? " active" : ""}" type="button" data-tab="${t.id}">
      <span>${t.icon} ${t.label}</span>
      <span class="panel-tab-badge">${t.count}</span>
    </button>`).join("");
  box.querySelectorAll(".panel-tab").forEach(btn => {
    btn.addEventListener("click", () => { state.tab = btn.dataset.tab; renderTabs(); renderList(); });
  });
}

function renderItem(o) {
  const isDone = o.status === "completed";
  return `
    <div class="panel-item branch-item" data-id="${esc(o.id)}">
      <div class="panel-item-accent"></div>
      <div class="panel-item-head">
        <div class="panel-item-head-main">
          <p class="panel-item-title">${esc(MOVING_TYPE[o.moving_type] || o.moving_type || "Taşıma")} — ${esc(o.room_size || "")}</p>
          <p class="panel-item-sub">${fmtDate(o.created_at)}</p>
        </div>
        <div class="panel-item-badges">
          <span class="panel-badge panel-badge--blue">${fmtMoney(o.price)}</span>
          ${isDone
            ? '<span class="panel-badge panel-badge--green">✅ Tamamlandı</span>'
            : '<span class="panel-badge panel-badge--warn">🚚 Aktif</span>'}
        </div>
      </div>
      <div class="panel-item-body">

        <div class="panel-parties">
          <div class="panel-party-box panel-party-sender">
            <div class="panel-party-label">📍 Çıkış Adresi</div>
            <div class="panel-party-name">${esc(o.contact_name || "—")}</div>
            <div class="panel-party-phone">${esc(o.contact_phone || "—")}</div>
            <div class="panel-party-address">${esc(o.origin_address || "—")}</div>
          </div>
          <div class="panel-party-box panel-party-recipient">
            <div class="panel-party-label">🏁 Varış Adresi</div>
            <div class="panel-party-address" style="font-size:13px">${esc(o.dest_address || "—")}</div>
          </div>
        </div>

        <div class="panel-detail-grid">
          <div><dt>Taşıma</dt><dd>${esc(MOVING_TYPE[o.moving_type] || o.moving_type || "—")}</dd></div>
          <div><dt>Oda Sayısı</dt><dd>${esc(o.room_size || "—")}</dd></div>
          <div><dt>Çıkış Katı</dt><dd>${esc(FLOOR_LABEL[o.origin_floor] || o.origin_floor || "—")}</dd></div>
          <div><dt>Varış Katı</dt><dd>${esc(FLOOR_LABEL[o.dest_floor] || o.dest_floor || "—")}</dd></div>
          <div><dt>Paketleme</dt><dd>${esc(PACK_LABEL[o.packing_service] || o.packing_service || "—")}</dd></div>
          ${o.distance_km ? `<div><dt>Mesafe</dt><dd>${o.distance_km} km</dd></div>` : ""}
          <div><dt>Atanma</dt><dd>${fmtDate(o.assigned_at)}</dd></div>
        </div>

        ${!isDone ? `
        <div class="panel-verify">
          <p class="panel-verify-title">✅ Taşıma Tamamlama Kodu</p>
          <p class="panel-verify-hint">Taşıma bittikten sonra müşterinin verdiği <strong>doğrulama kodunu</strong> girin.</p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code nakl-code" placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn nakl-verify-btn" type="button">Tamamlandı ✓</button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>`
        : `<div class="panel-done-row">✅ Tamamlandı: ${fmtDate(o.completed_at)}</div>`}
      </div>
    </div>`;
}

function renderList() {
  const box = $("#naklList");
  if (!box) return;
  const items = state.tab === "active" ? activeOrders() : completedOrders();
  if (!items.length) {
    const msgs = {
      active:    { icon: "🚚", title: "Aktif iş yok.", sub: "Admin tarafından atanan işler burada görünür." },
      completed: { icon: "✅", title: "Henüz tamamlanan iş yok.", sub: "" },
    };
    const em = msgs[state.tab] || msgs.active;
    box.innerHTML = `
      <div class="panel-empty">
        <div class="panel-empty-icon">${em.icon}</div>
        <h3>${em.title}</h3>
        ${em.sub ? `<p>${em.sub}</p>` : ""}
      </div>`;
    return;
  }
  box.innerHTML = items.map(renderItem).join("");
  box.querySelectorAll(".nakl-verify-btn").forEach(btn => {
    btn.addEventListener("click", () => onVerify(btn));
  });
}

async function onVerify(btn) {
  const card    = btn.closest(".branch-item");
  const orderId = card?.dataset.id;
  const input   = card?.querySelector(".nakl-code");
  const code    = input?.value.trim();
  const msg     = card?.querySelector(".branch-verify-msg");

  if (!orderId || !code) { toast("Kodu girin.", "err"); return; }

  setLoading(btn, true);
  try {
    await apiFetch("/api/moving/nakliyeci/verify", {
      method: "POST",
      body: { orderId, code },
    });
    if (msg) { msg.textContent = "✓ İş tamamlandı!"; msg.className = "panel-verify-msg branch-verify-msg ok"; }
    toast("Taşıma işi başarıyla tamamlandı! ✅", "ok");
    await loadOrders();
  } catch (e) {
    toast(e.message, "err");
    if (msg) { msg.textContent = "⚠️ " + e.message; msg.className = "panel-verify-msg branch-verify-msg err"; }
  } finally {
    setLoading(btn, false, "Tamamlandı ✓");
  }
}

async function loadOrders() {
  const data    = await apiFetch("/api/moving/nakliyeci/orders");
  state.orders  = data.orders || [];
  state.account = data.account || state.account;

  const name = state.account?.branch_name || "Nakliyeci";
  if ($("#naklTitle"))     $("#naklTitle").textContent     = name;
  if ($("#naklUserLabel")) $("#naklUserLabel").textContent = name;

  renderStats();
  renderTabs();
  renderList();
}

async function init() {
  await verifySession();
  const user = getUser();
  if (user?.role !== "branch") {
    $("#naklDenied")?.classList.remove("hidden");
    return;
  }
  $("#naklApp")?.classList.remove("hidden");
  $("#naklLogout")?.addEventListener("click", logout);
  try {
    await loadOrders();
  } catch (e) {
    toast(e.message, "err");
    state.orders = [];
    renderStats();
    renderTabs();
    renderList();
  }
}

init();
