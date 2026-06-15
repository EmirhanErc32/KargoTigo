import { CONFIG } from "./config.js";
import { apiFetch } from "./api.js";

const QUOTA_CACHE_KEY = "kargotigo_quota";
const REFILL_MS = 3 * 60 * 60 * 1000;

export function saveSession({ token, user, quota }) {
  localStorage.setItem(CONFIG.TOKEN_KEY, token);
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(normalizeUser(user)));
  if (quota) cacheQuota(quota);
}

export function cacheQuota(quota) {
  if (!quota) return;
  localStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify({ quota, at: Date.now() }));
}

export function loadCachedQuota() {
  try {
    const raw = localStorage.getItem(QUOTA_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).quota;
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.USER_KEY));
  } catch {
    return null;
  }
}

export function getDisplayName(user = getUser()) {
  const u = normalizeUser(user);
  return (u?.fullName || u?.full_name || "").trim();
}

/** Sayfadaki kullanici adi alanlarini gunceller. */
export function syncUserDisplay(user = getUser()) {
  const name = getDisplayName(user);
  const display = name || "Kullanıcı";
  const userEl = document.getElementById("userName");
  const welcomeEl = document.getElementById("welcomeName");
  if (userEl) userEl.textContent = display;
  if (welcomeEl) welcomeEl.textContent = display;
  return display;
}

export async function updateProfile(fullName) {
  const res = await apiFetch("/api/auth/profile", {
    method: "PATCH",
    body: { fullName: String(fullName || "").trim() },
  });
  if (res.user) {
    const merged = normalizeUser({
      ...getUser(),
      ...res.user,
      fullName: res.user.fullName || res.user.full_name,
    });
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(merged));
    syncUserDisplay(merged);
  }
  if (res.quota) {
    cacheQuota(res.quota);
    updateQuotaBadge(res.quota);
  }
  return res;
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(CONFIG.TOKEN_KEY));
}

export function logout() {
  clearSession();
  window.location.href = "index.html";
}

export function clearSession() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  localStorage.removeItem(QUOTA_CACHE_KEY);
}

export function register(email, password, fullName) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    auth: false,
    body: { email, password, fullName },
  }).then(async (res) => {
    if (res.token) {
      saveSession({ token: res.token, user: res.user, quota: res.quota });
      try {
        const me = await apiFetch("/api/auth/me");
        if (me.user) {
          const merged = normalizeUser({
            ...res.user,
            ...me.user,
            fullName: me.user.fullName || me.user.full_name,
          });
          localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(merged));
        }
      } catch { /* devam */ }
    }
    return { ...res, user: getUser() || res.user };
  });
}

export function login(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  }).then(async (res) => {
    if (res.token) {
      saveSession({ token: res.token, user: res.user, quota: res.quota });
      // Girişten hemen sonra DB'deki güncel profili al
      try {
        const me = await apiFetch("/api/auth/me");
        if (me.user) {
          const merged = normalizeUser({
            ...res.user,
            ...me.user,
            fullName: me.user.fullName || me.user.full_name,
          });
          localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(merged));
        }
      } catch {
        /* login yine de geçerli */
      }
    }
    return { ...res, user: getUser() || res.user };
  });
}

export function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function formatCountdownLong(ms) {
  if (!ms || ms <= 0) return "hazır";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0 && m > 0) return `${h} saat ${m} dakika`;
  if (h > 0) return `${h} saat`;
  if (m > 0) return `${m} dakika ${s} saniye`;
  return `${s} saniye`;
}

let quotaHoverTimer = null;
let quotaCountdownTimer = null;
let lastQuota = null;
let quotaTipEl = null;

const ADMIN_EMAILS = new Set(["admin@kargotigo.com"]);

function resolveRole(user) {
  if (!user) return "user";
  if (user.role === "admin" || user.role === "branch") return user.role;
  const email = String(user.email || "").trim().toLowerCase();
  if (ADMIN_EMAILS.has(email)) return "admin";
  return user.role || "user";
}

export function redirectAfterLogin(user, fallback = "app.html") {
  const role = resolveRole(user);
  if (role === "admin") return "admin.html";
  if (role === "branch") return "branch.html";
  return fallback;
}

export function redirectIfWrongAppPage(user) {
  const role = resolveRole(user);
  const page = window.location.pathname.split("/").pop() || "";
  if (role === "admin" && page !== "admin.html") {
    window.location.href = "admin.html";
    return true;
  }
  if (role === "branch" && !["branch.html", "kurye.html", "nakliyeci.html"].includes(page)) {
    window.location.href = "branch.html";
    return true;
  }
  if (role === "user" && (page === "admin.html" || page === "branch.html")) {
    window.location.href = "app.html";
    return true;
  }
  return false;
}

export function resolveUserRole(user) {
  return resolveRole(user);
}

function normalizeUser(user) {
  if (!user) return user;
  const role = resolveRole(user);
  return {
    ...user,
    role,
    fullName: user.fullName || user.full_name || null,
  };
}

function msUntilNext(quota) {
  if (quota?.nextAvailableAt) {
    return Math.max(0, new Date(quota.nextAvailableAt).getTime() - Date.now());
  }
  if (quota?.oldestActiveAt) {
    return Math.max(0, new Date(quota.oldestActiveAt).getTime() + REFILL_MS - Date.now());
  }
  if (quota?.msUntilNext && quota._cachedAt) {
    return Math.max(0, quota.msUntilNext - (Date.now() - quota._cachedAt));
  }
  return quota?.msUntilNext || 0;
}

function quotaHoverMessage(quota) {
  const remaining = quota?.remaining ?? 0;
  const limit = quota?.limit || 5;
  const ms = msUntilNext(quota);

  if (ms > 0) {
    return `Yeni sorgu hakkı için ${formatCountdownLong(ms)}`;
  }
  if (remaining > 0) {
    return `${remaining}/${limit} AI analiz hakkınız var`;
  }
  return "Tüm haklar kullanıldı";
}

function getQuotaTipEl() {
  if (!quotaTipEl) {
    quotaTipEl = document.createElement("div");
    quotaTipEl.id = "quotaHoverTip";
    quotaTipEl.className = "quota-badge-tip";
    quotaTipEl.setAttribute("role", "tooltip");
    document.body.appendChild(quotaTipEl);
  }
  return quotaTipEl;
}

function quotaElements() {
  return {
    badge: document.getElementById("quotaBadge"),
    label: document.getElementById("quotaBadgeLabel"),
  };
}

function renderQuotaLabel(quota) {
  const { label } = quotaElements();
  if (!label || !quota?.limited || quota.premium) return;
  const remaining = quota.remaining ?? 0;
  const limit = quota.limit || 5;
  label.textContent = remaining > 0 ? `${remaining}/${limit} Hak` : "Beklemede";
}

function positionQuotaTip() {
  const { badge } = quotaElements();
  const tip = getQuotaTipEl();
  if (!badge || tip.classList.contains("hidden")) return;
  const rect = badge.getBoundingClientRect();
  tip.style.left = `${rect.left + rect.width / 2}px`;
  tip.style.top = `${rect.bottom + 8}px`;
}

function showQuotaTip(quota) {
  const { badge, label } = quotaElements();
  if (!badge || !quota) return;

  const tip = getQuotaTipEl();
  const message = quotaHoverMessage(quota);
  const ms = msUntilNext(quota);

  tip.textContent = message;
  tip.classList.remove("hidden");
  badge.removeAttribute("title");

  if (ms > 0 && label) {
    label.textContent = `⏱ ${formatCountdownLong(ms)}`;
  }

  positionQuotaTip();
}

function hideQuotaTip() {
  const tip = getQuotaTipEl();
  tip.classList.add("hidden");
  const { badge } = quotaElements();
  if (badge && lastQuota) {
    badge.title = quotaHoverMessage(lastQuota);
  }
}

function bindQuotaHover() {
  const { badge } = quotaElements();
  if (!badge || badge.__quotaBound) return;
  badge.__quotaBound = true;

  badge.addEventListener("mouseenter", () => {
    if (!lastQuota?.limited || lastQuota.premium) return;
    const tick = () => showQuotaTip(lastQuota);
    tick();
    clearInterval(quotaHoverTimer);
    quotaHoverTimer = setInterval(tick, 1000);
  });

  badge.addEventListener("mouseleave", () => {
    clearInterval(quotaHoverTimer);
    quotaHoverTimer = null;
    hideQuotaTip();
    renderQuotaLabel(lastQuota);
  });

  window.addEventListener("scroll", positionQuotaTip, { passive: true });
  window.addEventListener("resize", positionQuotaTip, { passive: true });
}

export function updateQuotaBadge(quota) {
  const { badge } = quotaElements();
  if (!badge) return;

  const normalized = quota
    ? { ...quota, _cachedAt: Date.now(), msUntilNext: msUntilNext({ ...quota, _cachedAt: Date.now() }) }
    : null;
  lastQuota = normalized;

  if (!quota?.limited) {
    badge.classList.add("hidden");
    return;
  }
  badge.classList.remove("hidden");
  bindQuotaHover();

  if (quota.premium) {
    const { label } = quotaElements();
    if (label) label.textContent = "Premium";
    badge.title = "Sınırsız AI analiz";
    return;
  }

  renderQuotaLabel(normalized);

  const remaining = quota.remaining ?? 0;
  const limit = quota.limit || 5;
  const ms = msUntilNext(normalized);

  if (remaining < limit && !quota.nextAvailableAt && !quota.oldestActiveAt) {
    refreshQuotaBadge();
  }

  badge.classList.toggle("quota-warn", remaining <= 0);
  badge.title = quotaHoverMessage(normalized);

  if (quotaCountdownTimer) clearInterval(quotaCountdownTimer);
  if (ms > 0) {
    quotaCountdownTimer = setInterval(() => {
      const left = msUntilNext(lastQuota);
      if (left <= 0) {
        clearInterval(quotaCountdownTimer);
        refreshQuotaBadge();
        return;
      }
      if (!badge.matches(":hover")) {
        badge.title = quotaHoverMessage({ ...lastQuota, msUntilNext: left });
      }
    }, 1000);
  }

  const hint = document.getElementById("wizardQuotaHint");
  if (hint && quota.limited && !quota.premium) {
    hint.textContent = ms > 0
      ? quotaHoverMessage(normalized)
      : remaining > 0
        ? `${remaining}/${limit} AI analiz hakkı`
        : "AI hakkı doldu";
  }
}

export function showCachedQuotaBadge() {
  updateQuotaBadge(loadCachedQuota());
}

export async function verifySession() {
  if (!isLoggedIn()) return false;
  try {
    const res = await apiFetch("/api/auth/me");
    if (res.user) {
      const merged = normalizeUser({
        ...getUser(),
        ...res.user,
        fullName: res.user.fullName || res.user.full_name,
        role: res.user.role,
        email: res.user.email || getUser()?.email,
      });
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(merged));
      syncUserDisplay(merged);
      redirectIfWrongAppPage(merged);
    }
    if (res.quota) {
      cacheQuota(res.quota);
      updateQuotaBadge(res.quota);
    }
    await refreshQuotaBadge();
    return true;
  } catch (err) {
    if (err.status === 401 || err.authExpired) return false;
    return true;
  }
}

export async function refreshQuotaBadge() {
  if (!isLoggedIn()) return;
  try {
    const res = await apiFetch("/api/auth/quota");
    cacheQuota(res.quota);
    updateQuotaBadge(res.quota);
  } catch {
    /* sessiz */
  }
}

if (document.getElementById("quotaBadge")) {
  showCachedQuotaBadge();
}
