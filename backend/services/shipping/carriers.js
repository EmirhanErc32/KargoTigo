/**
 * KARGO FIRMALARI ve fiyat profilleri.
 *
 * Turkiye'de kargo fiyatlandirmasi "desi" uzerinden yapilir:
 *   desi = (en x boy x yukseklik [cm]) / volumetricDivisor
 *   ucretlendirilen = max(gercek_agirlik_kg, desi)
 *
 * Asagidaki degerler 2024-2026 Turkiye piyasasina yakin YAKLASIK tarifelerdir.
 * Gercek fiyat icin ilgili kargo firmasina basvurun.
 *
 *  baseFee           : Sabit baslangic ucreti (TRY)
 *  perDesi           : Desi/kg basina ucret (TRY)
 *  perKm             : Km basina ek ucret (TRY) - mesafe etkisi (dusuk tutulur)
 *  volumetricDivisor : Desi boleni (yurt ici 3000, hava 5000)
 *  maxDesi           : Kabul edilen maksimum desi
 *  maxWeightKg       : Kabul edilen maksimum agirlik
 *  handlingDays      : Islem/teslim alma suresi (gun)
 *  speedKmDay        : Gunluk menzil (tahmini sure icin)
 *  scope             : "domestic" | "international"
 *
 * Ornek (5 desi, Istanbul→Ankara ~450 km):
 *   Aras  : 82 + 5×11   + 450×0.025 = 82 + 55  + 11 = ₺148
 *   Surат : 70 + 5×11.5 + 450×0.020 = 70 + 57  +  9 = ₺136
 *   PTT   : 78 + 5×14   + 450×0.035 = 78 + 70  + 16 = ₺164
 */
export const CARRIERS = [
  // ─────────────────── YURT İÇİ ───────────────────

  // Sürat — bütçe dostu, orta-büyük paketlerde ön plana çıkar
  {
    id: "surat",
    name: "Sürat Kargo",
    scope: "domestic",
    baseFee: 70,
    perDesi: 11.5,
    perKm: 0.020,
    volumetricDivisor: 3000,
    maxDesi: 1200,
    maxWeightKg: 1200,
    handlingDays: 2,
    speedKmDay: 650,
    color: "#00a651",
  },

  // Sendeo — e-ticaret odaklı, küçük-orta paketlerde ucuz
  {
    id: "sendeo",
    name: "Sendeo",
    scope: "domestic",
    baseFee: 68,
    perDesi: 12.0,
    perKm: 0.022,
    volumetricDivisor: 3000,
    maxDesi: 1000,
    maxWeightKg: 1000,
    handlingDays: 2,
    speedKmDay: 650,
    color: "#6c2bd9",
  },

  // MNG — büyük/ağır kargolarda rekabetçi
  {
    id: "mng",
    name: "MNG Kargo",
    scope: "domestic",
    baseFee: 78,
    perDesi: 10.5,
    perKm: 0.028,
    volumetricDivisor: 3000,
    maxDesi: 1500,
    maxWeightKg: 1500,
    handlingDays: 1,
    speedKmDay: 700,
    color: "#f7941e",
  },

  // Aras — geniş ağ, orta fiyat
  {
    id: "aras",
    name: "Aras Kargo",
    scope: "domestic",
    baseFee: 82,
    perDesi: 11.0,
    perKm: 0.025,
    volumetricDivisor: 3000,
    maxDesi: 1500,
    maxWeightKg: 1500,
    handlingDays: 1,
    speedKmDay: 750,
    color: "#e2001a",
  },

  // PTT — devlet, küçük paketlerde uygun; büyüklerde pahalılaşır
  {
    id: "ptt",
    name: "PTT Kargo",
    scope: "domestic",
    baseFee: 78,
    perDesi: 14.0,
    perKm: 0.035,
    volumetricDivisor: 3000,
    maxDesi: 1000,
    maxWeightKg: 1000,
    handlingDays: 2,
    speedKmDay: 600,
    color: "#ffcb05",
  },

  // Yurtiçi — en büyük ağ, premium fiyat, hızlı
  {
    id: "yurtici",
    name: "Yurtiçi Kargo",
    scope: "domestic",
    baseFee: 90,
    perDesi: 12.0,
    perKm: 0.032,
    volumetricDivisor: 3000,
    maxDesi: 1500,
    maxWeightKg: 1500,
    handlingDays: 1,
    speedKmDay: 750,
    color: "#0a3d91",
  },

  // HepsiJET — hızlı teslimat, en yüksek fiyat
  {
    id: "hepsijet",
    name: "HepsiJET",
    scope: "domestic",
    baseFee: 95,
    perDesi: 13.5,
    perKm: 0.038,
    volumetricDivisor: 3000,
    maxDesi: 800,
    maxWeightKg: 800,
    handlingDays: 1,
    speedKmDay: 800,
    color: "#ff6000",
  },

  // ─────────────────── ULUSLARARASI ───────────────────

  // Aramex — ekonomik uluslararası
  {
    id: "aramex",
    name: "Aramex",
    scope: "international",
    baseFee: 650,
    perDesi: 28,
    perKm: 0.08,
    volumetricDivisor: 5000,
    maxDesi: 3000,
    maxWeightKg: 3000,
    handlingDays: 3,
    speedKmDay: 3500,
    color: "#e2231a",
  },

  // UPS — orta segment uluslararası
  {
    id: "ups",
    name: "UPS",
    scope: "international",
    baseFee: 780,
    perDesi: 32,
    perKm: 0.10,
    volumetricDivisor: 5000,
    maxDesi: 5000,
    maxWeightKg: 5000,
    handlingDays: 2,
    speedKmDay: 4000,
    color: "#5a3a1b",
  },

  // FedEx — hızlı uluslararası
  {
    id: "fedex",
    name: "FedEx",
    scope: "international",
    baseFee: 850,
    perDesi: 34,
    perKm: 0.11,
    volumetricDivisor: 5000,
    maxDesi: 5000,
    maxWeightKg: 5000,
    handlingDays: 2,
    speedKmDay: 4500,
    color: "#4d148c",
  },

  // DHL — premium ekspres
  {
    id: "dhl",
    name: "DHL Express",
    scope: "international",
    baseFee: 950,
    perDesi: 38,
    perKm: 0.12,
    volumetricDivisor: 5000,
    maxDesi: 5000,
    maxWeightKg: 5000,
    handlingDays: 1,
    speedKmDay: 5000,
    color: "#d40511",
  },
];
