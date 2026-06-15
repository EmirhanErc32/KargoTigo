import { apiFetch, getToken } from "./api.js";
import { CONFIG } from "./config.js";
import { downloadInvoicePdf as saveInvoicePdf, viewInvoiceHtml } from "./invoice-pdf.js";
import { $, toast, $$ } from "./ui.js";

let historyData = null;
let activeTab = "warehouses";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtMoney(amount, currency = "TRY") {
  if (amount == null || amount === "") return null;
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
}

function statusClass(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("odendi") || s.includes("paid") || s.includes("delivered")) return "ok";
  if (s.includes("bekl") || s.includes("pending")) return "warn";
  return "neutral";
}

function emptyState(msg) {
  return `<div class="history-empty"><p>${msg}</p></div>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderWarehousePaidPanel(item) {
  return `
    <div class="history-wh-success-grid">
      <div class="history-wh-panel wh-success-card">
        <div class="history-wh-panel-head">
          <span class="history-wh-panel-icon">✅</span>
          <div>
            <strong>Rezervasyon Tamamlandi</strong>
            <span class="muted">Depo erişim şifreleriniz</span>
          </div>
        </div>
        <div class="wh-password-box entry">
          <span class="wh-pw-label">Depo Giriş Şifresi</span>
          <span class="wh-pw-hint">Ürünü depoya teslim ederken kullanın</span>
          <div class="code">${escapeHtml(item.entryPassword || "—")}</div>
        </div>
        <div class="wh-password-box exit">
          <span class="wh-pw-label">Depo Çıkış Şifresi</span>
          <span class="wh-pw-hint">Ürünü depodan teslim alırken kullanın</span>
          <div class="code">${escapeHtml(item.exitPassword || "—")}</div>
        </div>
      </div>
      <div class="history-wh-panel history-wh-invoice">
        <h4>🧾 E-Fatura</h4>
        <p class="muted">Faturanizi PDF olarak indirebilirsiniz.</p>
        <p class="history-wh-invoice-no">Fatura No: <strong>${escapeHtml(item.invoiceNo || "—")}</strong></p>
        <div class="history-wh-invoice-actions">
          <button class="btn btn-primary btn-sm" type="button" data-wh-pdf-invoice="${escapeHtml(item.id)}">PDF Indir</button>
          <button class="btn btn-outline btn-sm" type="button" data-wh-view-invoice="${escapeHtml(item.id)}">Faturayi Goruntule</button>
        </div>
      </div>
    </div>`;
}

function renderWarehouseItem(item) {
  const price = fmtMoney(item.amount, item.currency);
  const paid = item.paymentStatus === "paid" || item.status === "Odendi";
  const dims =
    item.lengthCm && item.widthCm && item.heightCm
      ? `${item.lengthCm}×${item.widthCm}×${item.heightCm} cm`
      : null;

  const summaryParts = [
    item.storageDays ? `${item.storageDays} gun` : null,
    item.areaSqm ? `${item.areaSqm} m²` : null,
    item.weightKg ? `${item.weightKg} kg` : null,
  ].filter(Boolean);

  return `
    <article class="history-wh-card" data-wh-id="${escapeHtml(item.id)}">
      <header class="history-wh-head">
        <div class="history-wh-head-main">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="history-item-sub">${escapeHtml(item.subtitle || "")}</span>
          <time>${fmtDate(item.createdAt)}</time>
        </div>
        <div class="history-wh-head-side">
          ${price ? `<span class="history-price">${price}</span>` : ""}
          <span class="history-status history-status--${statusClass(item.status)}">${escapeHtml(item.status || "")}</span>
        </div>
      </header>

      ${summaryParts.length ? `<p class="history-wh-summary">${escapeHtml(summaryParts.join(" · "))}</p>` : ""}

      <button class="btn btn-sm btn-outline history-wh-toggle" type="button" data-wh-toggle="${escapeHtml(item.id)}">
        Detaylar
      </button>

      <div class="history-wh-expand hidden">
        <div class="history-wh-specs">
          <div class="history-wh-spec"><span>${item.storageDays || "—"}</span><label>Depolama (gun)</label></div>
          <div class="history-wh-spec"><span>${item.areaSqm || "—"}</span><label>Alan (m²)</label></div>
          <div class="history-wh-spec"><span>${item.weightKg || "—"}</span><label>Ağırlık (kg)</label></div>
          ${dims ? `<div class="history-wh-spec"><span>${escapeHtml(dims)}</span><label>Boyutlar</label></div>` : ""}
        </div>

        ${item.storageSubtotal != null ? `
          <div class="history-wh-pricing">
            <div><span>Depolama</span><strong>${fmtMoney(item.storageSubtotal, item.currency)}</strong></div>
            <div><span>KDV</span><strong>${fmtMoney(item.kdv, item.currency)}</strong></div>
            <div class="total"><span>Toplam</span><strong>${price || "—"}</strong></div>
          </div>` : ""}

        ${paid ? renderWarehousePaidPanel(item) : `
          <div class="history-wh-pending">
            <span>⏳</span>
            <p>Ödeme tamamlanmadı. Şifreler ödeme sonrası görünür.</p>
          </div>`}

        <details class="history-wh-details">
          <summary>İletişim ve ürün detayları</summary>
          <dl class="history-wh-dl">
            ${item.firstName || item.lastName ? `<div><dt>Ad Soyad</dt><dd>${escapeHtml([item.firstName, item.lastName].filter(Boolean).join(" "))}</dd></div>` : ""}
            ${item.contactPhone ? `<div><dt>Telefon</dt><dd>${escapeHtml(item.contactPhone)}</dd></div>` : ""}
            ${item.email ? `<div><dt>E-posta</dt><dd>${escapeHtml(item.email)}</dd></div>` : ""}
            ${item.userAddress ? `<div><dt>Ürün konumu</dt><dd>${escapeHtml(item.userAddress)}</dd></div>` : ""}
            ${item.personalAddress ? `<div><dt>Kisisel adres</dt><dd>${escapeHtml(item.personalAddress)}</dd></div>` : ""}
            ${item.notes ? `<div><dt>Not</dt><dd>${escapeHtml(item.notes)}</dd></div>` : ""}
            ${item.paidAt ? `<div><dt>Ödeme tarihi</dt><dd>${fmtDate(item.paidAt)}</dd></div>` : ""}
          </dl>
        </details>
      </div>
    </article>`;
}

function renderQueryItem(item) {
  const price = fmtMoney(item.amount, item.currency);
  const typeLabel =
    item.type === "analysis" ? "AI Analiz" : item.type === "shipping" ? "Fiyat Sorgusu" : "Sorgu";
  return `
    <article class="history-item">
      <div class="history-item-main">
        <span class="history-type-badge">${typeLabel}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="history-item-sub">${escapeHtml(item.subtitle || "")}</span>
        ${item.meta ? `<span class="history-item-meta">${escapeHtml(item.meta)}</span>` : ""}
        ${item.confidence != null ? `<span class="history-item-meta">Guven: %${Math.round(item.confidence * 100)}</span>` : ""}
      </div>
      <div class="history-item-side">
        ${price ? `<span class="history-price">${price}</span>` : ""}
        <time>${fmtDate(item.createdAt)}</time>
      </div>
    </article>`;
}

function renderCourierItem(item) {
  const price = fmtMoney(item.amount, item.currency);
  const vol = item.lengthCm && item.widthCm && item.heightCm
    ? `${item.lengthCm}×${item.widthCm}×${item.heightCm} cm`
    : "";
  const specs = [item.weightKg ? `${item.weightKg} kg` : "", vol].filter(Boolean).join(" · ");
  const codes = item.pickupCode || item.deliveryCode
    ? `<div class="history-courier-codes">
        ${item.pickupCode ? `<span><small>Alım:</small> <strong>${escapeHtml(item.pickupCode)}</strong></span>` : ""}
        ${item.deliveryCode ? `<span><small>Teslim:</small> <strong>${escapeHtml(item.deliveryCode)}</strong></span>` : ""}
      </div>`
    : "";
  return `
    <article class="history-item history-item--courier">
      <div class="history-item-main">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="history-item-sub">${escapeHtml(item.subtitle || "")}</span>
        ${item.route ? `<span class="history-item-meta">${escapeHtml(item.route)}</span>` : ""}
        ${specs ? `<span class="history-item-meta">${escapeHtml(specs)}</span>` : ""}
        ${codes}
      </div>
      <div class="history-item-side">
        ${price ? `<span class="history-price">${price}</span>` : ""}
        <span class="history-status history-status--${statusClass(item.status)}">${escapeHtml(item.status || "")}</span>
        <time>${fmtDate(item.createdAt)}</time>
      </div>
    </article>`;
}

function renderMovingItem(item) {
  const price = fmtMoney(item.price || item.amount, "TRY");
  const typeLabel = item.moving_type === "ofis" ? "Ofis Taşıma" : "Ev Taşıma";
  const statusMap = {
    pending_payment: "Ödeme Bekleniyor",
    paid: "Ödendi",
    assigned: "Nakliyeci Atandı",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };
  const statusStr = statusMap[item.status] || item.status || "—";
  return `
    <article class="history-item history-item--courier">
      <div class="history-item-main">
        <strong>🚛 ${escapeHtml(typeLabel)} — ${escapeHtml(item.room_size || "")}</strong>
        <span class="history-item-sub">${escapeHtml(item.origin_address || "—")} → ${escapeHtml(item.dest_address || "—")}</span>
        ${item.confirm_code && item.payment_status === "paid" ? `<span class="history-item-meta">🔑 Doğrulama Kodu: <strong>${escapeHtml(item.confirm_code)}</strong></span>` : ""}
      </div>
      <div class="history-item-side">
        ${price ? `<span class="history-price">${price}</span>` : ""}
        <span class="history-status history-status--${statusClass(item.status)}">${escapeHtml(statusStr)}</span>
        <time>${fmtDate(item.created_at)}</time>
      </div>
    </article>`;
}

async function fetchInvoiceHtml(bookingId) {
  const res = await fetch(`${CONFIG.API_BASE}/api/warehouses/bookings/${bookingId}/invoice`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    let msg = "Fatura alinamadi.";
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch { /* html error body */ }
    throw new Error(msg);
  }
  return res.text();
}

async function viewWarehouseInvoice(bookingId) {
  try {
    const html = await fetchInvoiceHtml(bookingId);
    viewInvoiceHtml(html);
  } catch (e) {
    toast(e.message, "err");
  }
}

async function downloadWarehouseInvoice(bookingId, invoiceNo) {
  try {
    const html = await fetchInvoiceHtml(bookingId);
    await saveInvoicePdf(html, invoiceNo || bookingId);
  } catch (e) {
    toast(e.message, "err");
  }
}

function syncWarehouseDrawerWidth() {
  const anyOpen = $$(".history-wh-expand:not(.hidden)").length > 0;
  $(".history-drawer")?.classList.toggle("history-drawer--wide", activeTab === "warehouses" && anyOpen);
}

function onHistoryContentClick(e) {
  const toggleBtn = e.target.closest("[data-wh-toggle]");
  if (toggleBtn) {
    const card = toggleBtn.closest(".history-wh-card");
    const expand = card?.querySelector(".history-wh-expand");
    if (!expand) return;
    const isHidden = expand.classList.toggle("hidden");
    toggleBtn.textContent = isHidden ? "Detaylar" : "Gizle";
    toggleBtn.classList.toggle("active", !isHidden);
    card.classList.toggle("expanded", !isHidden);
    syncWarehouseDrawerWidth();
    return;
  }

  const viewBtn = e.target.closest("[data-wh-view-invoice]");
  const pdfBtn = e.target.closest("[data-wh-pdf-invoice]");
  if (viewBtn) {
    viewWarehouseInvoice(viewBtn.dataset.whViewInvoice);
    return;
  }
  if (pdfBtn) {
    const card = pdfBtn.closest(".history-wh-card");
    const invoiceNo = card?.querySelector(".history-wh-invoice-no strong")?.textContent?.trim();
    downloadWarehouseInvoice(pdfBtn.dataset.whPdfInvoice, invoiceNo);
  }
}

function renderList() {
  const box = $("#historyContent");
  if (!box) return;

  if (!historyData) {
    box.innerHTML = `<div class="history-loading">Yükleniyor…</div>`;
    return;
  }

  const map = {
    warehouses: {
      items: historyData.warehouses || [],
      render: renderWarehouseItem,
      empty: "Henüz depo kiralama işleminiz yok.",
    },
    queries: {
      items: historyData.queries || [],
      render: renderQueryItem,
      empty: "Henüz sorgu veya AI analiz kaydınız yok.",
    },
    courier: {
      items: historyData.courier || [],
      render: renderCourierItem,
      empty: "Henüz şehir içi kurye gönderiniz yok.",
    },
    moving: {
      items: historyData.moving || [],
      render: renderMovingItem,
      empty: "Henüz nakliyat siparişiniz yok.",
    },
  };

  const tab = map[activeTab];
  if (!tab.items.length) {
    box.innerHTML = emptyState(tab.empty);
    return;
  }

  const listClass = activeTab === "warehouses" ? "history-list history-list--warehouse history-list-animate" : "history-list history-list-animate";
  box.innerHTML = `<div class="${listClass}">${tab.items.map(tab.render).join("")}</div>`;
  flashHistoryBody();
}

function flashHistoryBody() {
  const el = $("#historyContent");
  if (!el) return;
  el.classList.remove("history-body--switch");
  void el.offsetWidth;
  el.classList.add("history-body--switch");
}

function setTab(name) {
  activeTab = name;
  $$(".history-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  syncWarehouseDrawerWidth();
  renderList();
}

async function loadHistory() {
  historyData = null;
  renderList();
  try {
    const res = await apiFetch("/api/history");
    historyData = res.history || { warehouses: [], queries: [], courier: [], moving: [] };
    updateTabCounts();
    renderList();
  } catch (e) {
    toast(e.message || "Geçmiş yüklenemedi", "error");
    historyData = { warehouses: [], queries: [], courier: [] };
    renderList();
  }
}

function updateTabCounts() {
  if (!historyData) return;
  const counts = {
    warehouses: (historyData.warehouses || []).length,
    queries: (historyData.queries || []).length,
    courier: (historyData.courier || []).length,
    moving: (historyData.moving || []).length,
  };
  Object.entries(counts).forEach(([key, n]) => {
    const el = $(`.history-tab[data-tab="${key}"] .history-tab-count`);
    if (el) el.textContent = n > 0 ? String(n) : "";
  });
}

function openPanel() {
  const panel = $("#historyPanel");
  if (!panel) return;
  panel.classList.remove("hidden", "history-panel--closing");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("history-open");
  syncWarehouseDrawerWidth();
  loadHistory();
}

function closePanel() {
  const panel = $("#historyPanel");
  if (!panel || panel.classList.contains("hidden")) return;

  const finish = () => {
    panel.classList.add("hidden");
    panel.classList.remove("history-panel--closing");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("history-open");
  };

  panel.classList.add("history-panel--closing");
  window.setTimeout(finish, 280);
}

export function initHistory() {
  $("#historyBtn")?.addEventListener("click", openPanel);
  $("#historyCloseBtn")?.addEventListener("click", closePanel);
  $("#historyBackdrop")?.addEventListener("click", closePanel);
  $("#historyContent")?.addEventListener("click", onHistoryContentClick);

  $$(".history-tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#historyPanel")?.classList.contains("hidden")) {
      closePanel();
    }
  });
}

export function refreshHistoryIfOpen() {
  if (!$("#historyPanel")?.classList.contains("hidden")) {
    loadHistory();
  }
}
