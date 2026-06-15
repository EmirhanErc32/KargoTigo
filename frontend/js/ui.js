/**
 * Kucuk UI yardimcilari: secici, eleman olusturma, toast bildirim.
 */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Hizli eleman olusturucu. el("div", {class:"x"}, "metin") */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function toast(message, type = "info", ms = 3500) {
  let host = $("#toasts");
  if (!host) {
    host = el("div", { id: "toasts" });
    document.body.append(host);
  }
  const t = el("div", { class: `toast ${type}` }, message);
  host.append(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity .25s";
    setTimeout(() => t.remove(), 250);
  }, ms);
}

export function clearToasts() {
  document.getElementById("toasts")?.remove();
}

/** Bir butonu yukleniyor durumuna alir/cikarir. */
export function setLoading(btn, loading, idleText) {
  if (!btn) return;
  if (loading) {
    btn.dataset.idle = idleText ?? btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Lütfen bekleyin...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.idle || idleText || "Tamam";
  }
}

export function fmtMoney(n, currency = "TRY") {
  if (n === null || n === undefined) return "-";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}
