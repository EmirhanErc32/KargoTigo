import { el } from "./ui.js";

export const CARRIER_TRACKERS = [
  {
    id: "yurtici",
    name: "Yurtici Kargo",
    short: "YK",
    scope: "domestic",
    color: "#0a3d91",
    domain: "yurticikargo.com",
    url: "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula",
  },
  {
    id: "aras",
    name: "Aras Kargo",
    short: "AR",
    scope: "domestic",
    color: "#e2001a",
    domain: "araskargo.com.tr",
    url: "https://www.araskargo.com.tr/tr/cargo-tracking",
  },
  {
    id: "mng",
    name: "MNG Kargo",
    short: "MNG",
    scope: "domestic",
    color: "#f7941e",
    domain: "mngkargo.com.tr",
    url: "https://www.mngkargo.com.tr/gonderi-takip",
  },
  {
    id: "ptt",
    name: "PTT Kargo",
    short: "PTT",
    scope: "domestic",
    color: "#c9a000",
    domain: "ptt.gov.tr",
    url: "https://gonderitakip.ptt.gov.tr/",
  },
  {
    id: "surat",
    name: "Surat Kargo",
    short: "SK",
    scope: "domestic",
    color: "#00a651",
    domain: "suratkargo.com.tr",
    url: "https://www.suratkargo.com.tr/KargoTakip/",
  },
  {
    id: "sendeo",
    name: "Sendeo",
    short: "SD",
    scope: "domestic",
    color: "#6c2bd9",
    domain: "sendeo.com.tr",
    url: "https://www.sendeo.com.tr/gonderi-takip",
  },
  {
    id: "hepsijet",
    name: "HepsiJET",
    short: "HJ",
    scope: "domestic",
    color: "#ff6000",
    domain: "hepsijet.com",
    url: "https://www.hepsijet.com/gonderi-takip",
  },
  {
    id: "ups",
    name: "UPS",
    short: "UPS",
    scope: "international",
    color: "#5a3a1b",
    domain: "ups.com",
    url: "https://www.ups.com/track?loc=tr_TR",
  },
  {
    id: "dhl",
    name: "DHL Express",
    short: "DHL",
    scope: "international",
    color: "#d40511",
    domain: "dhl.com",
    url: "https://www.dhl.com/tr-tr/home/tracking.html",
  },
  {
    id: "fedex",
    name: "FedEx",
    short: "FX",
    scope: "international",
    color: "#4d148c",
    domain: "fedex.com",
    url: "https://www.fedex.com/fedextrack/?locale=tr_TR",
  },
  {
    id: "aramex",
    name: "Aramex",
    short: "AX",
    scope: "international",
    color: "#e2231a",
    domain: "aramex.com",
    url: "https://www.aramex.com/tr/tr/track/shipments",
  },
];

function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function carrierLogo(carrier) {
  const wrap = el("div", { class: "carrier-track-logo" });
  const fallback = el("span", {
    class: "carrier-track-logo-fallback",
    style: `background:${carrier.color}`,
  }, carrier.short);
  const img = el("img", {
    src: faviconUrl(carrier.domain),
    alt: "",
    width: "32",
    height: "32",
    loading: "lazy",
  });
  img.addEventListener("error", () => {
    img.remove();
  });
  wrap.append(img, fallback);
  return wrap;
}

function carrierCard(carrier, { onOpen, getTrackingCode }) {
  return el("a", {
    class: "carrier-track-card",
    href: carrier.url,
    target: "_blank",
    rel: "noopener noreferrer",
    onclick: () => {
      const code = getTrackingCode?.();
      if (code && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
      onOpen?.(carrier, code);
    },
  },
    carrierLogo(carrier),
    el("span", { class: "carrier-track-name" }, carrier.name),
    el("span", { class: "carrier-track-go", "aria-hidden": "true" }, "↗")
  );
}

function carrierSection(title, carriers, handlers) {
  if (!carriers.length) return null;
  return el("section", { class: "carrier-track-section" },
    el("h3", { class: "track-section-title" }, title),
    el("div", { class: "carrier-track-grid" },
      ...carriers.map((c) => carrierCard(c, handlers))
    )
  );
}

const FILTER_LABELS = { all: "Tumu", domestic: "Yurt Ici", international: "Global" };

export function renderCarrierTrackGrid(container, handlers = {}) {
  if (!container) return;

  let activeFilter = "all";
  let searchQuery = "";

  const searchWrap = el("div", { class: "track-search-wrap" },
    el("span", {
      class: "track-search-icon",
      "aria-hidden": "true",
      html: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5.5"/><path d="M12.5 12.5L16 16"/></svg>',
    }),
    el("input", {
      class: "input track-search-input",
      type: "search",
      placeholder: "Firma ara...",
      "aria-label": "Kargo firmasi ara",
    })
  );

  const filters = el("div", { class: "track-filters", role: "tablist" },
    ...["all", "domestic", "international"].map((f) =>
      el("button", {
        class: `track-filter-tab ${f === activeFilter ? "active" : ""}`,
        type: "button",
        role: "tab",
        "data-filter": f,
      }, FILTER_LABELS[f])
    )
  );

  const header = el("div", { class: "track-toolbar" }, searchWrap, filters);
  const body = el("div", { class: "track-carriers-body" });
  container.innerHTML = "";
  container.append(header, body);

  const searchInput = header.querySelector(".track-search-input");
  const filterTabs = header.querySelectorAll(".track-filter-tab");

  function filtered() {
    return CARRIER_TRACKERS.filter((c) => {
      const matchFilter = activeFilter === "all" || c.scope === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.id.includes(q);
      return matchFilter && matchSearch;
    });
  }

  function paint() {
    const items = filtered();
    body.innerHTML = "";

    if (!items.length) {
      body.append(el("p", { class: "muted center track-carriers-empty" }, "Eslesen firma bulunamadi."));
      return;
    }

    const domestic = items.filter((c) => c.scope === "domestic");
    const international = items.filter((c) => c.scope === "international");

    if (activeFilter === "all" && !searchQuery) {
      const dom = carrierSection("Yurt Ici", domestic, handlers);
      const intl = carrierSection("Uluslararasi", international, handlers);
      if (dom) body.append(dom);
      if (intl) body.append(intl);
    } else {
      body.append(
        el("div", { class: "carrier-track-grid carrier-track-grid-single" },
          ...items.map((c) => carrierCard(c, handlers))
        )
      );
    }
  }

  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    paint();
  });

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeFilter = tab.dataset.filter;
      filterTabs.forEach((t) => t.classList.toggle("active", t === tab));
      paint();
    });
  });

  paint();
}
