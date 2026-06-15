import { el, fmtMoney } from "./ui.js";
import { CARRIER_TRACKERS } from "./carrier-trackers.js";
import { findCarrierDomain } from "./carrier-brands.js";

function findCarrier(name = "") {
  const n = name.toLowerCase();
  return CARRIER_TRACKERS.find((c) =>
    n.includes(c.id) || n.includes(c.name.toLowerCase().split(" ")[0])
  );
}

export function renderCourierOptions(container, result, onSelect) {
  container.innerHTML = "";
  const info = el("p", { class: "muted svc-info" },
    `${result.city} · ${result.urgency} · ~${result.distanceKm} km` +
    (result.distanceEstimated ? " (tahmini)" : "")
  );
  const wrap = el("div", { class: "svc-options" });

  result.options.forEach((o, i) => {
    const card = el("button", {
      class: `svc-opt courier-opt ${o.feasible ? "" : "disabled"} ${i === 0 && o.feasible ? "best" : ""}`,
      type: "button",
      "data-id": o.vehicleId,
      onclick: () => o.feasible && onSelect(o),
    },
      o.feasible && i === 0 ? el("span", { class: "badge badge-ok" }, "En hizli") : null,
      el("div", { class: "svc-opt-head" },
        el("span", { class: "svc-opt-emoji" }, o.emoji),
        el("div", {},
          el("strong", {}, o.vehicle),
          el("span", { class: "muted" }, `~${o.estimatedMinutes} dk`)
        )
      ),
      el("div", { class: "svc-opt-price" }, fmtMoney(o.price)),
      o.feasible
        ? el("span", { class: "muted" }, "Secmek icin tiklayin")
        : el("span", { class: "badge badge-bad" }, o.reasons?.join(", "))
    );
    wrap.append(card);
  });

  container.append(info, wrap);
}

export function renderTrackingTimeline(container, tracking) {
  container.innerHTML = "";

  const matched = tracking.carrier ? findCarrier(tracking.carrier) : null;

  const head = el("div", { class: "track-head card card-pad" },
    el("div", { class: "track-head-top" },
      el("div", { class: "track-head-info" },
        matched
          ? el("img", {
            class: "track-head-logo",
            src: `https://www.google.com/s2/favicons?domain=${matched.domain}&sz=64`,
            alt: matched.name,
            width: "36",
            height: "36",
          })
          : null,
        el("span", { class: "muted" }, tracking.serviceLabel),
        el("h3", {}, tracking.trackingNumber),
        el("p", { class: "muted" }, `${tracking.origin} → ${tracking.destination}`)
      ),
      el("span", { class: "badge badge-ok track-status" }, tracking.statusLabel)
    ),
    tracking.carrier
      ? el("div", { class: "track-head-carrier" },
          el("p", { class: "muted" }, `Tasiyici: ${tracking.carrier}`),
          matched
            ? el("a", {
              class: "track-head-ext-link",
              href: matched.url,
              target: "_blank",
              rel: "noopener noreferrer",
            }, "Resmi sitede de takip et ↗")
            : null
        )
      : null
  );

  const timeline = el("div", { class: "timeline" });
  const events = tracking.events || [];

  events.forEach((ev, i) => {
    const isLast = i === events.length - 1;
    timeline.append(
      el("div", { class: `timeline-item ${isLast ? "active" : "done"}` },
        el("div", { class: "timeline-dot" }, ev.icon || "📍"),
        el("div", { class: "timeline-body" },
          el("strong", {}, ev.label),
          ev.location ? el("span", { class: "muted" }, ev.location) : null,
          ev.description ? el("p", {}, ev.description) : null,
          el("time", {}, formatDate(ev.event_at))
        )
      )
    );
  });

  container.append(head, timeline);
}

export function renderTrackingList(container, trackings, onSelect) {
  container.innerHTML = "";
  if (!trackings.length) {
    container.append(el("p", { class: "muted center" }, "Henüz gönderiniz yok."));
    return;
  }

  const wrap = el("div", { class: "track-list" });
  trackings.forEach((t) => {
    wrap.append(
      el("button", {
        class: "track-list-item",
        type: "button",
        onclick: () => onSelect(t.trackingNumber),
      },
        el("div", {},
          el("strong", {}, t.trackingNumber),
          el("span", { class: "muted" }, t.serviceLabel)
        ),
        el("span", { class: "badge" }, t.statusLabel)
      )
    );
  });
  container.append(wrap);
}

export function renderWarehouseGrid(container, warehouses, onSelect) {
  container.innerHTML = "";
  if (!warehouses.length) {
    container.append(el("p", { class: "muted center" }, "Bu filtreye uygun depo yok."));
    return;
  }

  const wrap = el("div", { class: "warehouse-grid" });
  warehouses.forEach((w) => {
    const typeLabel = { standard: "Standart", cold: "Soguk Zincir", fulfillment: "Fulfillment", bonded: "Antrepo" };
    wrap.append(
      el("button", {
        class: "warehouse-card",
        type: "button",
        onclick: () => onSelect(w),
      },
        el("div", { class: "wh-top" },
          el("span", { class: "wh-city" }, w.city),
          el("span", { class: "badge" }, typeLabel[w.type] || w.type)
        ),
        el("h4", {}, w.name),
        el("p", { class: "muted" }, w.district + " · " + w.address),
        el("div", { class: "wh-stats" },
          el("span", {}, `⭐ ${w.rating}`),
          el("span", {}, `${w.available_sqm} m² bos`),
          el("strong", {}, fmtMoney(w.price_monthly) + "/m²")
        ),
        el("div", { class: "wh-features" },
          ...(w.features || []).slice(0, 3).map((f) => el("span", { class: "wh-tag" }, f))
        )
      )
    );
  });
  container.append(wrap);
}

export function renderWarehouseBooking(container, result) {
  container.innerHTML = "";
  const { booking, pricing, warehouse } = result;
  container.append(
    el("div", { class: "card card-pad success-box" },
      el("h3", {}, "✅ Kiralama Talebi Alindi"),
      el("dl", { class: "specs" },
        el("dt", {}, "Depo"), el("dd", {}, warehouse.name),
        el("dt", {}, "Alan"), el("dd", {}, `${pricing.areaSqm} m²`),
        el("dt", {}, "Sure"), el("dd", {}, `${pricing.months} ay`),
        el("dt", {}, "Toplam"), el("dd", {}, fmtMoney(pricing.totalPrice)),
        el("dt", {}, "Durum"), el("dd", {}, "Onay bekliyor")
      ),
      el("p", { class: "muted", style: "margin-top:12px" },
        "Ekibimiz 24 saat icinde sizinle iletisime gececek.")
    )
  );
}

export function renderHeavyRequirements(container, requirements, allowedModes) {
  container.innerHTML = "";
  if (!requirements?.length) return;

  container.append(
    el("div", { class: "card card-pad heavy-req" },
      el("h4", {}, "📋 Gönderim Gereksinimleri"),
      el("ul", {}, ...requirements.map((i) => el("li", {}, i))),
      allowedModes?.length
        ? el("p", { class: "muted", style: "margin-top:12px" },
            "Uygun araclar: " + allowedModes.map((m) => `${m.emoji} ${m.label}`).join(", "))
        : null
    )
  );
}

function heavyCarrierLogo(option) {
  const domain = findCarrierDomain({ carrierId: option.carrierId, carrier: option.carrier });
  const wrap = el("div", { class: "ship-logo" });
  if (domain) {
    const img = el("img", {
      src: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      alt: "",
      width: "44",
      height: "44",
      loading: "lazy",
    });
    img.addEventListener("error", () => {
      wrap.innerHTML = "";
      wrap.append(fallbackHeavyLogo(option));
    });
    wrap.append(img);
  } else {
    wrap.append(fallbackHeavyLogo(option));
  }
  return wrap;
}

function fallbackHeavyLogo(option) {
  const initials = String(option.carrier || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return el("span", { class: "ship-logo-fallback", style: `background:${option.color || "#2a3766"}` }, initials);
}

function carrierInitials(name = "") {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function renderHeavyOptions(container, result) {
  container.innerHTML = "";
  const head = el("div", { class: "ship-result-head" },
    el("h3", {}, "Ağır Yük Teklifleri"),
    el("p", { class: "muted" },
      `${result.cargoLabel} · ${result.origin} → ${result.destination} · ~${result.distanceKm} km`)
  );
  const grid = el("div", { class: "ship-result-grid" });

  const sorted = [...(result.options || [])].sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return (a.price || 0) - (b.price || 0);
  });

  let bestMarked = false;
  sorted.forEach((o) => {
    const isBest = o.feasible && !bestMarked;
    if (isBest) bestMarked = true;

    if (!o.feasible) {
      grid.append(
        el("div", { class: "ship-result-card disabled" },
          el("div", { class: "ship-result-top" },
            heavyCarrierLogo(o),
            el("div", { class: "ship-result-info" },
              el("strong", {}, o.carrier),
              el("span", {}, `${o.emoji || "🚛"} ${o.mode || ""}`)
            ),
            el("span", { class: "badge badge-bad" }, o.reasons?.[0] || "Uygun değil")
          )
        )
      );
      return;
    }

    grid.append(
      el("div", { class: `ship-result-card ${isBest ? "best" : ""}` },
        isBest ? el("span", { class: "ship-best-tag" }, "En uygun") : null,
        el("div", { class: "ship-result-top" },
          heavyCarrierLogo(o),
          el("div", { class: "ship-result-info" },
            el("strong", {}, o.carrier),
            el("span", {}, `${o.emoji || "🚛"} ${o.mode || ""} · ~${o.estimatedDays || "?"} gün`)
          ),
          el("div", { class: "ship-result-price" }, fmtMoney(o.price, o.currency))
        ),
        o.note ? el("p", { class: "muted", style: "margin:8px 0 0;font-size:13px" }, o.note) : null
      )
    );
  });

  const disclaimer = el("div", { class: "ship-disclaimer" },
    el("strong", {}, "Bilgi amaçlıdır"),
    el("p", {}, result.disclaimer || "Fiyatlar tahminidir. Gönderi ve ödeme seçilen lojistik firması üzerinden yapılır.")
  );

  container.append(head, grid, disclaimer);
}

export function renderInternationalDocs(container, docs) {
  container.innerHTML = "";
  if (!docs) return;

  container.append(
    el("div", { class: "card card-pad intl-docs" },
      el("h4", {}, "📋 " + docs.title),
      el("ul", {}, ...docs.items.map((i) => el("li", {}, i))),
      el("h4", { style: "margin-top:16px" }, "⚠️ Yasaklı Ürünler"),
      el("ul", {}, ...docs.prohibited.map((i) => el("li", {}, i)))
    )
  );
}

export function renderInternationalOptions(container, result, onSelect) {
  container.innerHTML = "";
  const info = el("p", { class: "muted svc-info" },
    `${result.destination} · ~${result.distanceKm} km · Desi: ${result.chargeableDesi}`
  );
  const wrap = el("div", { class: "svc-options" });
  let best = false;

  result.options.filter((o) => o.feasible).forEach((o) => {
    const isBest = !best;
    if (isBest) best = true;
    wrap.append(
      el("button", {
        class: `svc-opt intl-opt ${isBest ? "best" : ""}`,
        type: "button",
        onclick: () => onSelect(o),
      },
        isBest ? el("span", { class: "badge badge-ok" }, "En uygun") : null,
        el("div", { class: "svc-opt-head" },
          el("span", {
            class: "carrier-logo-sm",
            style: `background:${o.color}`,
          }, o.carrier?.slice(0, 2)),
          el("div", {},
            el("strong", {}, o.carrier),
            el("span", { class: "muted" }, `~${o.estimatedDays} gun`)
          )
        ),
        el("div", { class: "svc-opt-price" }, fmtMoney(o.price, o.currency)),
        o.customsNote ? el("span", { class: "muted" }, o.customsNote) : null
      )
    );
  });

  container.append(info, wrap);
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
