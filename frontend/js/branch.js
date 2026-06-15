import { $, $$, toast, setLoading, fmtMoney } from "./ui.js";
import { apiFetch } from "./api.js";
import { requireLogin, verifySession, getUser, logout } from "./auth.js";

if (!requireLogin()) throw new Error("yonlendiriliyor");

let state = {
  isWarehouse: true,
  tab: "pending",
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

function dims(b) {
  if (b.length_cm && b.width_cm && b.height_cm)
    return `${b.length_cm} × ${b.width_cm} × ${b.height_cm} cm`;
  return "—";
}

function customerName(b) {
  return [b.first_name, b.last_name].filter(Boolean).join(" ") || "—";
}

/* ─ Depo banner ─────────────────────────────────────────────────── */
function renderDepotBanner(depot, account) {
  const banner = $("#branchDepotBanner");
  if (!banner) return;
  if (state.isWarehouse && (depot || account?.warehouse_id)) {
    banner.classList.remove("hidden");
    const d = depot || { id: account.warehouse_id, name: account.warehouse_id };
    const loc = [d.district, d.city].filter(Boolean).join(", ");
    banner.innerHTML = `
      <div class="panel-depot-icon">📦</div>
      <div class="panel-depot-info">
        <h2>${esc(d.name || d.id)}</h2>
        <p>${esc(loc || "İstanbul")}${d.address ? ` · ${esc(d.address)}` : ""}</p>
      </div>`;
  } else {
    banner.classList.add("hidden");
  }
}

/* ─ İstatistikler ───────────────────────────────────────────────── */
function renderStats() {
  const box = $("#branchStats");
  if (!box || !state.groups?.stats) return;
  const s = state.groups.stats;

  const items = state.isWarehouse
    ? [
        { icon: "⏳", label: "Teslim Edilecek", val: s.pending,   cls: "panel-stat--warn"  },
        { icon: "🏭", label: "Depoda",          val: s.inStorage, cls: "panel-stat--blue"  },
        { icon: "✅", label: "Teslim Edilmiş",  val: s.completed, cls: "panel-stat--green" },
      ]
    : [
        { icon: "📥", label: "Alınacak",       val: s.pending,   cls: "panel-stat--warn"   },
        { icon: "🚗", label: "Yolda",          val: s.inTransit, cls: "panel-stat--orange" },
        { icon: "✅", label: "Teslim Edilmiş", val: s.delivered, cls: "panel-stat--green"  },
      ];

  box.innerHTML = items.map(it => `
    <div class="panel-stat ${it.cls}">
      <div class="panel-stat-icon">${it.icon}</div>
      <div class="panel-stat-body">
        <strong>${it.val}</strong>
        <span>${it.label}</span>
      </div>
    </div>`).join("");
}

/* ─ Sekmeler ────────────────────────────────────────────────────── */
function renderTabs() {
  const box = $("#branchTabs");
  if (!box || !state.groups?.stats) return;
  const s = state.groups.stats;

  const tabs = state.isWarehouse
    ? [
        { id: "pending",   label: "Teslim Edilecek", count: s.pending,   icon: "⏳" },
        { id: "storage",   label: "Depoda",          count: s.inStorage, icon: "🏭" },
        { id: "completed", label: "Teslim Edilmiş",  count: s.completed, icon: "✅" },
      ]
    : [
        { id: "pending",   label: "Alınacak",       count: s.pending,   icon: "📥" },
        { id: "transit",   label: "Yolda",          count: s.inTransit, icon: "🚗" },
        { id: "completed", label: "Teslim Edilmiş", count: s.delivered, icon: "✅" },
      ];

  box.innerHTML = tabs.map(t => `
    <button class="panel-tab branch-tab${state.tab === t.id ? " active" : ""}" type="button" data-tab="${t.id}">
      <span>${t.icon} ${esc(t.label)}</span>
      <span class="panel-tab-badge">${t.count}</span>
    </button>`).join("");

  box.querySelectorAll(".panel-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      renderTabs();
      renderList();
    });
  });
}

/* ─ Aktif öğeler ────────────────────────────────────────────────── */
function currentItems() {
  const g = state.groups;
  if (!g) return [];
  if (state.isWarehouse) {
    if (state.tab === "pending")   return g.pendingEntry || [];
    if (state.tab === "storage")   return g.inStorage    || [];
    return g.completed || [];
  }
  if (state.tab === "pending")  return g.pendingPickup || [];
  if (state.tab === "transit")  return g.inTransit     || [];
  return g.delivered || [];
}

/* ─ Depo kartı ──────────────────────────────────────────────────── */
function renderWarehouseItem(b) {
  const showEntry = state.tab === "pending";
  const showExit  = state.tab === "storage";
  const done      = state.tab === "completed";

  const statusBadge = done
    ? `<span class="panel-badge panel-badge--green">✅ Teslim Edildi</span>`
    : showExit
      ? `<span class="panel-badge panel-badge--blue">🏭 Depoda</span>`
      : `<span class="panel-badge panel-badge--warn">⏳ Teslim Edilecek</span>`;

  return `
    <div class="panel-item branch-item" data-id="${esc(b.id)}">
      <div class="panel-item-accent"></div>
      <div class="panel-item-head">
        <div class="panel-item-head-main">
          <p class="panel-item-title">${esc(customerName(b))}</p>
          <p class="panel-item-sub">${esc(b.invoice_no || b.id?.slice(0,8) || "—")} · ${fmtDate(b.created_at)}</p>
        </div>
        <div class="panel-item-badges">
          <span class="panel-badge panel-badge--gray">${b.weight_kg || "—"} kg</span>
          <span class="panel-badge panel-badge--gray">${b.area_sqm || "—"} m²</span>
          ${statusBadge}
        </div>
      </div>
      <div class="panel-item-body">

        <div class="panel-detail-grid">
          <div><dt>Ürün Sahibi</dt><dd>${esc(customerName(b))}</dd></div>
          <div><dt>TC Kimlik</dt><dd>${esc(b.tc_no || "—")}</dd></div>
          <div><dt>İletişim</dt><dd>${esc(b.contact_phone || b.email || "—")}</dd></div>
          <div><dt>Boyut</dt><dd>${esc(dims(b))}</dd></div>
          <div><dt>Depolama</dt><dd>${b.area_sqm || "—"} m² · ${b.storage_days || "—"} gün</dd></div>
          <div><dt>Depo</dt><dd>${esc(b.warehouse_name || b.warehouse_id || "—")}</dd></div>
          <div><dt>Adres</dt><dd>${esc(b.user_address || b.personal_address || "—")}</dd></div>
          <div><dt>Ödeme</dt><dd>${fmtMoney(b.total_price)} · ${esc(b.payment_status)}</dd></div>
          ${b.invoice_no ? `<div><dt>Fatura No</dt><dd style="font-weight:700;color:#1a56db">${esc(b.invoice_no)}</dd></div>` : ""}
        </div>

        ${b.entry_verified_at ? `<p style="font-size:12px;color:#15803d;margin-bottom:8px">✅ Giriş: ${fmtDate(b.entry_verified_at)}</p>` : ""}
        ${b.exit_verified_at  ? `<p style="font-size:12px;color:#15803d;margin-bottom:8px">✅ Çıkış: ${fmtDate(b.exit_verified_at)}</p>`  : ""}

        ${(showEntry || showExit) ? `
        <div class="panel-verify">
          <p class="panel-verify-title">
            ${showEntry ? "🔑 Depoya Giriş Doğrulaması" : "🔓 Depodan Çıkış Doğrulaması"}
          </p>
          <p class="panel-verify-hint">
            ${showEntry
              ? "Müşterinin size söylediği <strong>giriş kodunu</strong> girin."
              : "Müşterinin size söylediği <strong>teslim kodunu</strong> girin."}
          </p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code" data-action="${showEntry ? "entry" : "exit"}"
              placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn branch-verify-btn" data-action="${showEntry ? "entry" : "exit"}" type="button">
              ${showEntry ? "Depoya Al ✓" : "Teslim Et ✓"}
            </button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>` : ""}

        ${done ? `<div class="panel-done-row">✅ Ürün başarıyla teslim edildi</div>` : ""}
      </div>
    </div>`;
}

/* ─ Kurye kartı ─────────────────────────────────────────────────── */
function renderCourierItem(o) {
  const showPickup  = state.tab === "pending";
  const showDeliver = state.tab === "transit";
  const done        = state.tab === "completed";

  const statusBadge = done
    ? `<span class="panel-badge panel-badge--green">✅ Teslim Edildi</span>`
    : showDeliver
      ? `<span class="panel-badge panel-badge--blue">🚗 Yolda</span>`
      : `<span class="panel-badge panel-badge--warn">📦 Teslim Alınacak</span>`;

  return `
    <div class="panel-item branch-item" data-id="${esc(o.id)}">
      <div class="panel-item-accent"></div>
      <div class="panel-item-head">
        <div class="panel-item-head-main">
          <p class="panel-item-title" style="font-family:monospace">${esc(o.tracking_number || o.id?.slice(0,10) || "—")}</p>
          <p class="panel-item-sub">${esc(o.sender_name || "—")} → ${esc(o.recipient_name || "—")}</p>
        </div>
        <div class="panel-item-badges">
          <span class="panel-badge panel-badge--gray">${o.weight_kg || "—"} kg</span>
          ${statusBadge}
        </div>
      </div>
      <div class="panel-item-body">

        <div class="panel-parties">
          <div class="panel-party-box panel-party-sender">
            <div class="panel-party-label">📤 Gönderen (Alım Noktası)</div>
            <div class="panel-party-name">${esc(o.sender_name || "—")}</div>
            <div class="panel-party-phone">${esc(o.sender_phone || "—")}</div>
            <div class="panel-party-address">${esc(o.pickup_address || "—")}</div>
          </div>
          <div class="panel-party-box panel-party-recipient">
            <div class="panel-party-label">📥 Alıcı (Teslim Noktası)</div>
            <div class="panel-party-name">${esc(o.recipient_name || "—")}</div>
            <div class="panel-party-phone">${esc(o.recipient_phone || "—")}</div>
            <div class="panel-party-address">${esc(o.delivery_address || "—")}</div>
          </div>
        </div>

        <div class="panel-detail-grid">
          <div><dt>Paket</dt><dd>${esc(o.package_description || "—")}</dd></div>
          <div><dt>Ağırlık</dt><dd>${o.weight_kg || "—"} kg</dd></div>
          <div><dt>Tutar</dt><dd>${fmtMoney(o.price)}</dd></div>
          <div><dt>Tarih</dt><dd>${fmtDate(o.created_at)}</dd></div>
        </div>

        ${showPickup ? `
        <div class="panel-verify">
          <p class="panel-verify-title">🔑 Göndericiden Teslim Al</p>
          <p class="panel-verify-hint">Gönderici size <strong>alım kodunu</strong> söyleyecek. Kodu girin.</p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code" data-action="pickup" placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn branch-verify-btn" data-action="pickup" type="button">Teslim Aldım ✓</button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>` : ""}

        ${showDeliver ? `
        <div class="panel-verify">
          <p class="panel-verify-title">✅ Alıcıya Teslim Et</p>
          <p class="panel-verify-hint">Alıcı size <strong>teslim kodunu</strong> söyleyecek. Kodu girin.</p>
          <div class="panel-verify-row">
            <input class="panel-verify-input branch-code" data-action="delivery" placeholder="• • • • • •" maxlength="8" />
            <button class="panel-verify-btn branch-verify-btn" data-action="delivery" type="button">Teslim Ettim ✓</button>
          </div>
          <p class="panel-verify-msg branch-verify-msg"></p>
        </div>` : ""}

        ${done ? `<div class="panel-done-row">✅ Kargo başarıyla teslim edildi</div>` : ""}
      </div>
    </div>`;
}

/* ─ Liste ───────────────────────────────────────────────────────── */
function renderList() {
  const box = $("#branchShipments");
  if (!box) return;
  const items = currentItems();

  if (!items.length) {
    const emptyMsgs = {
      pending:   state.isWarehouse
        ? { icon: "📬", title: "Teslim edilecek ürün yok.", sub: "Ödeme tamamlanmış kayıtlar burada görünür." }
        : { icon: "📬", title: "Alınacak kargo yok.",      sub: "Admin tarafından atanan kargolar burada görünür." },
      storage:   { icon: "🏭", title: "Depoda bekleyen ürün yok.",   sub: "" },
      transit:   { icon: "🚗", title: "Yolda kargo yok.",            sub: "" },
      completed: { icon: "✅", title: "Henüz teslim edilmiş kayıt yok.", sub: "" },
    };
    const em = emptyMsgs[state.tab] || emptyMsgs.pending;
    box.innerHTML = `
      <div class="panel-empty">
        <div class="panel-empty-icon">${em.icon}</div>
        <h3>${em.title}</h3>
        ${em.sub ? `<p>${em.sub}</p>` : ""}
      </div>`;
    return;
  }

  box.innerHTML = items.map(item =>
    state.isWarehouse ? renderWarehouseItem(item) : renderCourierItem(item)
  ).join("");

  box.querySelectorAll(".branch-verify-btn").forEach(btn => {
    btn.addEventListener("click", () => onVerify(btn));
  });
}

/* ─ Doğrulama ───────────────────────────────────────────────────── */
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

    if (msg) {
      msg.textContent = "✓ Doğrulandı!";
      msg.className = "panel-verify-msg branch-verify-msg ok";
    }
    toast(
      action === "entry"    ? "Ürün depoya alındı!"      :
      action === "exit"     ? "Ürün teslim edildi!"       :
      action === "pickup"   ? "Kargo teslim alındı!"      :
      "Kargo başarıyla teslim edildi!", "ok"
    );

    if (res.verified) {
      if (action === "entry")    state.tab = "storage";
      if (action === "exit")     state.tab = "completed";
      if (action === "pickup")   state.tab = "transit";
      if (action === "delivery") state.tab = "completed";
      await loadShipments();
    }
  } catch (e) {
    toast(e.message, "err");
    if (msg) {
      msg.textContent = "⚠️ " + e.message;
      msg.className = "panel-verify-msg branch-verify-msg err";
    }
  } finally {
    const labels = { entry: "Depoya Al ✓", exit: "Teslim Et ✓", pickup: "Teslim Aldım ✓", delivery: "Teslim Ettim ✓" };
    setLoading(btn, false, labels[action] || "Doğrula");
  }
}

/* ─ Veri yükle ──────────────────────────────────────────────────── */
async function loadShipments() {
  const data = await apiFetch("/api/admin/branch/shipments");
  state.account     = data.account;
  state.isWarehouse = data.account?.branch_type === "warehouse";

  if (data.groups) {
    state.groups = data.groups;
  } else if (state.isWarehouse) {
    const wh = data.warehouse || [];
    state.groups = {
      pendingEntry: wh.filter(b => !b.entry_verified_at),
      inStorage:    wh.filter(b => b.entry_verified_at && !b.exit_verified_at),
      completed:    wh.filter(b => b.exit_verified_at),
      stats: {
        pending:   wh.filter(b => !b.entry_verified_at).length,
        inStorage: wh.filter(b => b.entry_verified_at && !b.exit_verified_at).length,
        completed: wh.filter(b => b.exit_verified_at).length,
        total: wh.length,
      },
    };
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

  const name = data.account?.branch_name || "Depo Yetkilisi";
  if ($("#branchTitle")) $("#branchTitle").textContent = name;
  if ($("#branchUserLabel")) $("#branchUserLabel").textContent = name;
  if ($("#branchAvatarInitial")) $("#branchAvatarInitial").textContent = name.charAt(0).toUpperCase();
  if ($("#branchAvatarHero")) {
    const initial = name.charAt(0).toUpperCase();
    $("#branchAvatarHero").textContent = initial;
    if ($("#branchAvatarInitial")) $("#branchAvatarInitial").textContent = initial;
  }

  renderDepotBanner(data.depot, data.account);
  renderStats();
  renderTabs();
  renderList();
}

/* ─ Başlat ──────────────────────────────────────────────────────── */
async function init() {
  await verifySession();
  const user = getUser();

  if (user?.role !== "branch") {
    $("#branchDenied")?.classList.remove("hidden");
    return;
  }

  $("#branchApp")?.classList.remove("hidden");
  $("#branchLogout")?.addEventListener("click", logout);

  try {
    await loadShipments();

    // Hesap tipine göre yönlendir
    if (state.account?.branch_type === "courier_worker") {
      window.location.href = "kurye.html"; return;
    }
    if (state.account?.branch_type === "moving") {
      window.location.href = "nakliyeci.html"; return;
    }
  } catch (e) {
    toast(e.message, "err");
    state.groups = {
      pendingEntry: [], inStorage: [], completed: [],
      pendingPickup: [], inTransit: [], delivered: [],
      stats: { pending: 0, inStorage: 0, completed: 0, inTransit: 0, delivered: 0, total: 0 },
    };
    renderStats();
    renderTabs();
    renderList();
  }
}

init();
