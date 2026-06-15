import { $, $$, toast, setLoading } from "./ui.js";
import { apiFetch } from "./api.js";
import { requireLogin, verifySession, getUser, logout } from "./auth.js";

if (!requireLogin()) throw new Error("yonlendiriliyor");

let state = {
  tab: "pickup",
  groups: null,
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

function renderStats() {
  const box = $("#kuryeStats");
  if (!box || !state.groups?.stats) return;
  const s = state.groups.stats;
  box.innerHTML = `
    <div class="panel-stat panel-stat--warn">
      <div class="panel-stat-icon">📦</div>
      <div class="panel-stat-body"><strong>${s.pending}</strong><span>Teslim Alınacak</span></div>
    </div>
    <div class="panel-stat panel-stat--orange">
      <div class="panel-stat-icon">🚗</div>
      <div class="panel-stat-body"><strong>${s.inTransit}</strong><span>Yolda</span></div>
    </div>
    <div class="panel-stat panel-stat--green">
      <div class="panel-stat-icon">✅</div>
      <div class="panel-stat-body"><strong>${s.delivered}</strong><span>Teslim Edildi</span></div>
    </div>`;
}

function renderTabs() {
  const box = $("#kuryeTabs");
  if (!box || !state.groups?.stats) return;
  const s = state.groups.stats;
  const tabs = [
    { id: "pickup",    icon: "📦", label: "Teslim Alınacak", count: s.pending   },
    { id: "transit",   icon: "🚗", label: "Yolda",           count: s.inTransit },
    { id: "delivered", icon: "✅", label: "Teslim Edildi",   count: s.delivered },
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

function currentItems() {
  const g = state.groups;
  if (!g) return [];
  if (state.tab === "pickup")    return g.pendingPickup || [];
  if (state.tab === "transit")   return g.inTransit     || [];
  return g.delivered || [];
}

function renderCard(o) {
  const isPickup   = state.tab === "pickup";
  const isTransit  = state.tab === "transit";
  const isDone     = state.tab === "delivered";

  const badge = isDone
    ? `<span class="panel-badge panel-badge--green">✅ Teslim Edildi</span>`
    : isTransit
      ? `<span class="panel-badge panel-badge--blue">🚗 Yolda</span>`
      : `<span class="panel-badge panel-badge--warn">📦 Teslim Alınacak</span>`;

  return `
    <div class="panel-item branch-item" data-id="${esc(o.id)}">
      <div class="panel-item-accent"></div>
      <div class="panel-item-head">
        <div class="panel-item-head-main">
          <p class="panel-item-title" style="font-family:monospace">${esc(o.tracking_number || o.id?.slice(0,10) || "—")}</p>
          <p class="panel-item-sub">${fmtDate(o.created_at)}</p>
        </div>
        <div class="panel-item-badges">
          <span class="panel-badge panel-badge--gray">${o.weight_kg || "—"} kg</span>
          ${badge}
        </div>
      </div>
      <div class="panel-item-body">

        <div class="panel-parties">
          <div class="panel-party-box panel-party-sender">
            <div class="panel-party-label">📤 Göndericiden Teslim Al</div>
            <div class="panel-party-name">${esc(o.sender_name || "—")}</div>
            <div class="panel-party-phone">${esc(o.sender_phone || "—")}</div>
            <div class="panel-party-address">${esc(o.pickup_address || "—")}</div>
          </div>
          <div class="panel-party-box panel-party-recipient">
            <div class="panel-party-label">📥 Alıcıya Teslim Et</div>
            <div class="panel-party-name">${esc(o.recipient_name || "—")}</div>
            <div class="panel-party-phone">${esc(o.recipient_phone || "—")}</div>
            <div class="panel-party-address">${esc(o.delivery_address || "—")}</div>
          </div>
        </div>

        <div class="panel-detail-grid">
          <div><dt>Paket</dt><dd>${esc(o.package_description || "—")}</dd></div>
          <div><dt>Ağırlık</dt><dd>${o.weight_kg || "—"} kg</dd></div>
          <div><dt>Tutar</dt><dd>${fmtMoney(o.price)}</dd></div>
          <div><dt>Sipariş Tarihi</dt><dd>${fmtDate(o.created_at)}</dd></div>
        </div>

        ${isPickup ? `
        <div class="panel-verify">
          <p class="panel-verify-title">🔑 Göndericiden Teslim Alma</p>
          <p class="panel-verify-hint">Gönderici size <strong>alım kodunu</strong> söyleyecek. Kodu girin ve kargoyu teslim alın.</p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code" data-action="pickup" placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn branch-verify-btn" data-action="pickup" type="button">Teslim Aldım ✓</button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>` : ""}

        ${isTransit ? `
        <div class="panel-verify">
          <p class="panel-verify-title">✅ Alıcıya Teslim</p>
          <p class="panel-verify-hint">Alıcı size <strong>teslim kodunu</strong> söyleyecek. Kodu girin ve kargoyu teslim edin.</p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code" data-action="delivery" placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn branch-verify-btn" data-action="delivery" type="button">Teslim Ettim ✓</button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>` : ""}

        ${isDone ? `<div class="panel-done-row">✅ Kargo başarıyla teslim edildi</div>` : ""}
      </div>
    </div>`;
}

function renderList() {
  const box = $("#kuryeList");
  if (!box) return;
  const items = currentItems();
  if (!items.length) {
    const msgs = {
      pickup:    { icon: "📬", title: "Teslim alınacak kargo yok.", sub: "Admin tarafından atanan kargolar burada görünür." },
      transit:   { icon: "🚗", title: "Yolda kargo yok.", sub: "" },
      delivered: { icon: "✅", title: "Henüz teslim edilmiş kargo yok.", sub: "" },
    };
    const em = msgs[state.tab] || msgs.pickup;
    box.innerHTML = `
      <div class="panel-empty">
        <div class="panel-empty-icon">${em.icon}</div>
        <h3>${em.title}</h3>
        ${em.sub ? `<p>${em.sub}</p>` : ""}
      </div>`;
    return;
  }
  box.innerHTML = items.map(renderCard).join("");
  box.querySelectorAll(".branch-verify-btn").forEach(btn => {
    btn.addEventListener("click", () => onVerify(btn));
  });
}

async function onVerify(btn) {
  const card   = btn.closest(".branch-item");
  const id     = card?.dataset.id;
  const action = btn.dataset.action;
  const input  = card?.querySelector(`.branch-code[data-action="${action}"]`);
  const code   = input?.value.trim();
  const msg    = card?.querySelector(".branch-verify-msg");

  if (!id || !code) return toast("Kodu girin.", "err");

  setLoading(btn, true);
  try {
    const res = await apiFetch("/api/admin/branch/verify", {
      method: "POST",
      body: { referenceId: id, code, action },
    });
    if (msg) { msg.textContent = "✓ Doğrulandı!"; msg.className = "panel-verify-msg branch-verify-msg ok"; }
    toast(action === "pickup" ? "Kargo teslim alındı! Yola çıkabilirsiniz. 🚗" : "Kargo başarıyla teslim edildi! ✅", "ok");
    if (res.verified) {
      state.tab = action === "pickup" ? "transit" : "delivered";
      await loadShipments();
    }
  } catch (e) {
    toast(e.message, "err");
    if (msg) { msg.textContent = "⚠️ " + e.message; msg.className = "panel-verify-msg branch-verify-msg err"; }
  } finally {
    setLoading(btn, false, action === "pickup" ? "Teslim Aldım ✓" : "Teslim Ettim ✓");
  }
}

async function loadShipments() {
  const data    = await apiFetch("/api/admin/branch/shipments");
  state.account = data.account;

  if (data.groups) {
    state.groups = data.groups;
  } else {
    const co = data.courier || [];
    state.groups = {
      pendingPickup: co.filter(o => !o.status || o.status === "paid" || o.status === "order_received"),
      inTransit:     co.filter(o => o.status === "picked_up"),
      delivered:     co.filter(o => o.status === "delivered"),
      stats: {
        pending:   co.filter(o => !o.status || o.status === "paid" || o.status === "order_received").length,
        inTransit: co.filter(o => o.status === "picked_up").length,
        delivered: co.filter(o => o.status === "delivered").length,
        total: co.length,
      },
    };
  }

  const name = data.account?.branch_name || "Kurye";
  if ($("#kuryeName"))     $("#kuryeName").textContent     = name;
  if ($("#kuryeUserLabel")) $("#kuryeUserLabel").textContent = name;

  renderStats();
  renderTabs();
  renderList();
}

async function init() {
  await verifySession();
  const user = getUser();
  if (user?.role !== "branch") {
    $("#kuryeDenied")?.classList.remove("hidden");
    return;
  }
  $("#kuryeApp")?.classList.remove("hidden");
  $("#kuryeLogout")?.addEventListener("click", logout);
  try {
    await loadShipments();
    if (state.account && state.account.branch_type !== "courier_worker") {
      window.location.href = state.account.branch_type === "moving" ? "nakliyeci.html" : "branch.html";
      return;
    }
  } catch (e) {
    toast(e.message, "err");
    state.groups = {
      pendingPickup: [], inTransit: [], delivered: [],
      stats: { pending: 0, inTransit: 0, delivered: 0, total: 0 },
    };
    renderStats();
    renderTabs();
    renderList();
  }
}

init();
