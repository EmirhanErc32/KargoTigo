/**
 * citySelect(inputEl, options)
 * ─────────────────────────────
 * Bir <input> üzerine özel şehir seçim dropdown'ı bağlar.
 */

const CITIES_CACHE = [];

export async function fetchCities() {
  if (CITIES_CACHE.length) return [...CITIES_CACHE];
  try {
    const { apiFetch } = await import("./api.js");
    const res = await apiFetch("/api/shipping/cities", { auth: false });
    const list = (res.cities || []).map(c => c.charAt(0).toUpperCase() + c.slice(1));
    CITIES_CACHE.push(...list);
    return list;
  } catch {
    return [];
  }
}

export function citySelect(inputEl, { cities = [], onSelect = null } = {}) {
  if (!inputEl) return { destroy: () => {} };

  // Wrap input
  inputEl.setAttribute("autocomplete", "off");
  inputEl.setAttribute("spellcheck", "false");

  const wrap = document.createElement("div");
  wrap.className = "cs-wrap";
  inputEl.parentNode.insertBefore(wrap, inputEl);
  wrap.appendChild(inputEl);

  const dropdown = document.createElement("div");
  dropdown.className = "cs-dropdown hidden";
  wrap.appendChild(dropdown);

  let highlighted = -1;
  let current = "";

  function filter(q) {
    if (!q) return cities;
    const lq = q.toLowerCase().replace(/i/g, "i").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ü/g, "u").replace(/ö/g, "o");
    return cities.filter(c => {
      const lc = c.toLowerCase().replace(/i/g, "i").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ü/g, "u").replace(/ö/g, "o");
      return lc.startsWith(lq) || lc.includes(lq);
    }).slice(0, 10);
  }

  function open(list) {
    if (!list.length) { close(); return; }
    highlighted = -1;
    dropdown.innerHTML = list.map((c, i) => `
      <div class="cs-item" data-idx="${i}" data-val="${c}">
        <span class="cs-item-icon">📍</span>${c}
      </div>`).join("");
    dropdown.classList.remove("hidden");

    dropdown.querySelectorAll(".cs-item").forEach(item => {
      item.addEventListener("mousedown", e => {
        e.preventDefault();
        selectCity(item.dataset.val);
      });
      item.addEventListener("mouseover", () => {
        highlight(+item.dataset.idx);
      });
    });
  }

  function close() {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    highlighted = -1;
  }

  function highlight(idx) {
    dropdown.querySelectorAll(".cs-item").forEach((el, i) => {
      el.classList.toggle("cs-item--active", i === idx);
    });
    highlighted = idx;
  }

  function selectCity(val) {
    inputEl.value = val;
    current = val;
    close();
    onSelect?.(val);
  }

  inputEl.addEventListener("input", () => {
    open(filter(inputEl.value));
  });

  inputEl.addEventListener("focus", () => {
    const list = filter(inputEl.value);
    if (list.length) open(list);
  });

  inputEl.addEventListener("blur", () => {
    setTimeout(close, 150);
  });

  inputEl.addEventListener("keydown", e => {
    const items = dropdown.querySelectorAll(".cs-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight(Math.min(highlighted + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(Math.max(highlighted - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      const item = items[highlighted];
      if (item) selectCity(item.dataset.val);
    } else if (e.key === "Escape") {
      close();
    }
  });

  return {
    destroy() {
      dropdown.remove();
      wrap.parentNode?.insertBefore(inputEl, wrap);
      wrap.remove();
    },
  };
}
