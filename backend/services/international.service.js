import { quoteInternal } from "./shipping/internal.provider.js";
import { CARRIERS } from "./shipping/carriers.js";

export const COUNTRIES = [
  { code: "de", name: "Almanya", region: "ab", flag: "🇩🇪", transitDays: 3 },
  { code: "fr", name: "Fransa", region: "ab", flag: "🇫🇷", transitDays: 3 },
  { code: "gb", name: "Ingiltere", region: "gb", flag: "🇬🇧", transitDays: 4 },
  { code: "us", name: "Amerika", region: "us", flag: "🇺🇸", transitDays: 5 },
  { code: "cn", name: "Cin", region: "cn", flag: "🇨🇳", transitDays: 7 },
  { code: "jp", name: "Japonya", region: "jp", flag: "🇯🇵", transitDays: 6 },
  { code: "nl", name: "Hollanda", region: "ab", flag: "🇳🇱", transitDays: 3 },
  { code: "ae", name: "BAE", region: "me", flag: "🇦🇪", transitDays: 4 },
];

const REGION_DOCS = {
  ab: {
    title: "Avrupa Birliği Gönderi Evrakları",
    items: [
      "İngilizce ticari fatura (HS Code detayli)",
      "Çeki listesi (ağırlık ve ölçüler)",
      "A.TR belgesi (sanayi ürünleri için)",
      "Alıcı EORI numarası (şirket gönderileri)",
    ],
  },
  gb: {
    title: "İngiltere Gönderi Evrakları",
    items: [
      "İngilizce ticari fatura + mense beyani",
      "Ceki listesi ve sevk irsaliyesi",
      "GB formatli EORI numarası",
      "A.TR belgesi gecersiz — menşe beyani zorunlu",
    ],
  },
  us: {
    title: "ABD Gönderi Evrakları",
    items: [
      "Ingilizce ticari/proforma fatura",
      "Air Waybill (AWB)",
      "800 USD alti De Minimis muafiyeti",
      "Ithalatci bilgileri (EIN/SSN)",
    ],
  },
  cn: {
    title: "Çin Gönderi Evrakları",
    items: [
      "Ingilizce-Cince ticari fatura",
      "Alıcı CR Code (gümrük kayıt kodu)",
      "CCC sertifikasi (elektronik ürünler)",
      "Detaylı ürün içerik açıklaması",
    ],
  },
  jp: {
    title: "Japonya Gönderi Evrakları",
    items: [
      "Kusursuz İngilizce ticari fatura",
      "Mense sahadetnamesi",
      "MSDS/saglik sertifikalari (gida/kimyasal)",
      "Japonca etiket bilgileri (gerektiginde)",
    ],
  },
  me: {
    title: "Orta Doğu Gönderi Evrakları",
    items: [
      "İngilizce ticari fatura",
      "Menşe sahadetnamesi",
      "Halal sertifikasi (gıda ürünleri)",
      "Alıcı ticaret lisansı kopyasi",
    ],
  },
};

export function getCountries() {
  return COUNTRIES;
}

export function getCountryDocs(countryCode) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return null;
  return {
    country,
    docs: REGION_DOCS[country.region] || REGION_DOCS.ab,
    prohibited: [
      "Lityum piller (MSDS belgesiz)",
      "Yanici spreyler ve parfümler",
      "Bozulabilir gıda ürünleri",
    ],
    tips: [
      "HS Code (GTIP) doğru girilmelidir",
      "Fatura degeri gercek ticari degeri yansitmali",
      "Sigorta uluslararası gönderiler için önerilir",
    ],
  };
}

/**
 * Uluslararasi kargo teklifi — sadece international carrier'lar.
 */
export function quoteInternational(p) {
  const country = COUNTRIES.find((c) => c.code === p.countryCode);
  const destination = country ? country.name : p.destination || "Yurt Disi";

  const result = quoteInternal({
    weightKg: p.weightKg,
    lengthCm: p.lengthCm,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
    origin: p.origin || "İstanbul",
    destination,
    distanceKm: p.distanceKm || countryDistance(country?.code),
    international: true,
  });

  const intlCarriers = CARRIERS.filter((c) => c.scope === "international").map((c) => c.name);
  const options = result.options
    .filter((o) => intlCarriers.includes(o.carrier) || o.feasible)
    .map((o) => ({
      ...o,
      estimatedDays: country ? Math.max(o.estimatedDays, country.transitDays) : o.estimatedDays,
      customsNote: country ? `${destination} gumruk sureci dahil` : null,
    }));

  return {
    ...result,
    country,
    destination,
    docs: country ? getCountryDocs(country.code) : null,
    options,
    provider: "internal-international",
  };
}

function countryDistance(code) {
  const map = { de: 2200, fr: 2400, gb: 2800, us: 9000, cn: 7500, jp: 8500, nl: 2300, ae: 3200 };
  return map[code] || 3000;
}
