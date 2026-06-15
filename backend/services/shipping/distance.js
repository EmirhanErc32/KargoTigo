/**
 * Basit mesafe yardimcisi.
 * Gercek bir cografi kodlama (geocoding) API'si olmadan, sik kullanilan
 * Turkiye sehirleri arasi yaklasik karayolu mesafelerini saglar.
 * Bilinmeyen ciftler icin null doner; bu durumda kullanicidan mesafe
 * istenir veya varsayilan kullanilir.
 */

// Buyuk sehirlerin yaklasik koordinatlari (lat, lon)
const CITY_COORDS = {
  istanbul: [41.0082, 28.9784],
  ankara: [39.9334, 32.8597],
  izmir: [38.4237, 27.1428],
  bursa: [40.1885, 29.061],
  antalya: [36.8969, 30.7133],
  adana: [37.0, 35.3213],
  konya: [37.8714, 32.4846],
  gaziantep: [37.0662, 37.3833],
  trabzon: [41.0015, 39.7178],
  erzurum: [39.9043, 41.2679],
  diyarbakir: [37.9144, 40.2306],
  samsun: [41.2867, 36.33],
  kayseri: [38.7312, 35.4787],
  eskisehir: [39.7767, 30.5206],
  mersin: [36.8121, 34.6415],
};

function normalize(name) {
  return String(name || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

/** Haversine: iki koordinat arasi kus ucusu mesafe (km). */
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Iki sehir arasi tahmini KARAYOLU mesafesi (km).
 * Kus ucusu mesafeyi ~1.25 ile carparak yola yaklastiririz.
 */
export function estimateDistanceKm(origin, destination) {
  const a = CITY_COORDS[normalize(origin)];
  const b = CITY_COORDS[normalize(destination)];
  if (!a || !b) return null;
  if (normalize(origin) === normalize(destination)) return 20; // sehir ici
  return Math.round(haversineKm(a, b) * 1.25);
}

export function knownCities() {
  return Object.keys(CITY_COORDS);
}
