import { CONFIG } from "./config.js";

/** localStorage'dan token okur. */
export function getToken() {
  return localStorage.getItem(CONFIG.TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
}

function redirectToLogin() {
  if (window.__authRedirecting) return;
  window.__authRedirecting = true;
  const returnPage = window.location.pathname.includes("app.html") ? "app.html" : "";
  const q = new URLSearchParams({ expired: "1" });
  if (returnPage) q.set("redirect", returnPage);
  window.location.href = `login.html?${q}`;
}

/**
 * Merkezi fetch sarmalayicisi.
 *  - Token'i otomatik ekler (Authorization: Bearer ...)
 *  - JSON veya FormData govdesini dogru sekilde gonderir
 *  - Hatali cevaplarda anlamli Error firlatir
 */
export async function apiFetch(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } };

  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    opts.body = body; // Content-Type'i tarayici otomatik ayarlar
  } else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${CONFIG.API_BASE}${path}`, opts);

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* govde bos olabilir */
  }

  if (!res.ok || (data && data.success === false)) {
    const msg = (data && data.message) || `İstek başarısız (${res.status})`;

    if (res.status === 429) {
      const err = new Error(msg);
      err.status = 429;
      err.quotaExceeded = true;
      throw err;
    }

    if (res.status === 401 && auth) {
      clearSession();
      redirectToLogin();
      const err = new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      err.status = 401;
      err.authExpired = true;
      throw err;
    }

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
