import { el, fmtMoney } from "./ui.js";
import { findCarrierDomain } from "./carrier-brands.js";

const VEHICLE_EMOJI = {
  motosiklet: "🏍️",
  van: "🚐",
  kamyon: "🚚",
  ucak: "✈️",
  gemi: "🚢",
  truck: "🚛",
  trailer: "🚛",
  bus: "🚌",
  plane: "✈️",
  ship: "🚢",
};

function carrierLogo(option) {
  const domain = findCarrierDomain(option);
  const wrap = el("div", { class: "ship-logo" });
  if (domain) {
    const img = el("img", {
      src: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      alt: "",
      width: "40",
      height: "40",
      loading: "lazy",
    });
    img.addEventListener("error", () => {
      wrap.innerHTML = "";
      wrap.append(fallbackBadge(option));
    });
    wrap.append(img);
  } else {
    wrap.append(fallbackBadge(option));
  }
  return wrap;
}

function fallbackBadge(option) {
  const initials = String(option.carrier || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return el("span", {
    class: "ship-logo-fallback",
    style: `background:${option.color || "#2a3766"}`,
  }, initials);
}

export function renderAnalysisForm(container, analysis) {
  container.innerHTML = "";
  const isManual = analysis.manual;
  const conf = Math.round((Number(analysis.confidence) || 0) * 100);
  const grid = el("div", { class: "result-grid" });
  const left = isManual
    ? el("div", { class: "card card-pad manual-badge-card" },
        el("span", { class: "badge badge-ok" }, "Manuel giriş"),
        el("p", { class: "muted", style: "margin-top:12px" }, "Fotoğraf analizi kullanılmadı. Bilgileri kontrol edip devam edin.")
      )
    : el("div", { class: "card card-pad" },
        el("div", { class: "muted" }, "AI Güven Skoru"),
        el("div", { style: "font-size:30px;font-weight:800" }, `%${conf}`),
        el("div", { class: "confidence-bar" }, el("span", { style: `width:${conf}%` })),
        el("dl", { class: "specs" },
          el("dt", {}, "Kategori"), el("dd", {}, analysis.category || "-"),
          el("dt", {}, "Marka"), el("dd", {}, analysis.brand || "-"),
          el("dt", {}, "Model"), el("dd", {}, analysis.model || "-")
        )
      );
  const inp = (id, label, value, type = "text", attrs = {}) =>
    el("div", { class: "field" },
      el("label", { for: id }, label),
      el("input", { class: "input", id, type, value: value ?? "", ...attrs })
    );
  const right = el("div", { class: "card card-pad" },
    el("h3", {}, "Ürün Bilgilerini Onayla / Düzelt"),
    el("p", { class: "muted", style: "margin-bottom:14px" }, "AI değerlerini kontrol edin."),
    el("div", { class: "row row-2" },
      inp("f_product", "Ürün Adı", analysis.product_name),
      inp("f_brand", "Marka", analysis.brand)
    ),
    el("div", { class: "row row-2" },
      inp("f_model", "Model", analysis.model),
      inp("f_weight", "Ağırlık (kg)", analysis.weight_kg, "number", { step: "0.1", min: "0" })
    ),
    el("div", { class: "row row-3" },
      inp("f_len", "Uzunluk (cm)", analysis.length_cm, "number", { step: "0.1", min: "0" }),
      inp("f_wid", "Genişlik (cm)", analysis.width_cm, "number", { step: "0.1", min: "0" }),
      inp("f_hei", "Yükseklik (cm)", analysis.height_cm, "number", { step: "0.1", min: "0" })
    )
  );
  grid.append(left, right);
  container.append(grid);
  return () => ({
    product_name: container.querySelector("#f_product").value.trim(),
    brand: container.querySelector("#f_brand").value.trim(),
    model: container.querySelector("#f_model").value.trim(),
    weight_kg: container.querySelector("#f_weight").value,
    length_cm: container.querySelector("#f_len").value,
    width_cm: container.querySelector("#f_wid").value,
    height_cm: container.querySelector("#f_hei").value,
  });
}

export function renderSources(container, sources = []) {
  container.innerHTML = "";
  if (!sources.length) return;
  container.append(
    el("div", { class: "sources card card-pad" },
      el("div", { class: "muted" }, "🔎 Google kaynakları"),
      el("ul", {},
        ...sources.slice(0, 6).map((s) =>
          el("li", {}, "🔗", el("a", { href: s.uri, target: "_blank", rel: "noopener" }, s.title || s.uri))
        )
      )
    )
  );
}

export function renderShippingOptions(container, result) {
  container.innerHTML = "";
  const feasible = result.options.filter((o) => o.feasible);
  const head = el("div", { class: "ship-result-head" },
    el("h3", {}, "En Uygun Fiyatlar"),
    el("p", { class: "muted" },
      `~${result.distanceKm ?? "?"} km · ${result.chargeableDesi ?? "?"} desi · ${feasible.length} firma`)
  );
  const grid = el("div", { class: "ship-result-grid" });
  let best = true;

  result.options.forEach((o) => {
    if (!o.feasible) return;
    const card = el("div", { class: `ship-result-card ${best ? "best" : ""}` },
      best ? el("span", { class: "ship-best-tag" }, "En uygun") : null,
      el("div", { class: "ship-result-top" },
        carrierLogo(o),
        el("div", { class: "ship-result-info" },
          el("strong", {}, o.carrier),
          el("span", {}, `${VEHICLE_EMOJI[o.vehicle] || "📦"} ${o.vehicleLabel || o.vehicle} · ~${o.estimatedDays} gün`)
        ),
        el("div", { class: "ship-result-price" }, fmtMoney(o.price, o.currency))
      )
    );
    grid.append(card);
    best = false;
  });

  if (!feasible.length) {
    grid.append(el("p", { class: "muted" }, "Uygun firma bulunamadı."));
  }

  const disclaimer = el("div", { class: "ship-disclaimer" },
    el("strong", {}, "Bilgi amaçlıdır"),
    el("p", {}, result.disclaimer || "Fiyatlar tahminidir. Ödeme seçilen kargo firması üzerinden yapılır.")
  );

  container.append(head, grid, disclaimer);
}
