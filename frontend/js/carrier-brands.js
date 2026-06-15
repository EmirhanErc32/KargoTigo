/** Kargo firmasi id -> favicon domain eslemesi */
export const CARRIER_DOMAINS = {
  yurtici: "yurticikargo.com",
  aras: "araskargo.com.tr",
  mng: "mngkargo.com.tr",
  ptt: "ptt.gov.tr",
  surat: "suratkargo.com.tr",
  sendeo: "sendeo.com.tr",
  hepsijet: "hepsijet.com",
  ups: "ups.com",
  dhl: "dhl.com",
  fedex: "fedex.com",
  aramex: "aramex.com",
  horoz: "horoz.com.tr",
  borusan: "borusanlojistik.com",
  ekol: "ekol.com",
  netlog: "netloglogistics.com",
  ceva: "cevalogistics.com",
  "mng-freight": "mngkargo.com.tr",
  pts: "pts.net",
  ulusoy: "ulusoy.com.tr",
  ido: "ido.com.tr",
  "turkish-cargo": "turkishcargo.com.tr",
};

export function carrierFavicon(idOrName = "") {
  const key = String(idOrName).toLowerCase().replace(/\s+/g, "-");
  const domain = CARRIER_DOMAINS[key] || CARRIER_DOMAINS[Object.keys(CARRIER_DOMAINS).find((k) => key.includes(k))];
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
}

export function findCarrierDomain(option = {}) {
  const id = option.carrierId || option.id || "";
  const name = option.carrier || option.name || "";
  const n = name.toLowerCase();
  for (const [k, d] of Object.entries(CARRIER_DOMAINS)) {
    if (id === k || n.includes(k.replace("-", " ")) || n.includes(k)) return d;
  }
  if (n.includes("yurti")) return CARRIER_DOMAINS.yurtici;
  if (n.includes("aras")) return CARRIER_DOMAINS.aras;
  if (n.includes("horoz")) return CARRIER_DOMAINS.horoz;
  return null;
}
