/**
 * İstanbul genelinde 30 depo noktasi — lat/lng ile en yakin depo hesabi icin.
 */
const DISTRICTS = [
  { district: "Kadıköy", lat: 40.9927, lng: 29.0277, price: 210 },
  { district: "Beşiktaş", lat: 41.0422, lng: 29.0089, price: 245 },
  { district: "Şişli", lat: 41.0602, lng: 28.9877, price: 230 },
  { district: "Bakırköy", lat: 40.978, lng: 28.872, price: 195 },
  { district: "Esenyurt", lat: 41.029, lng: 28.679, price: 145 },
  { district: "Ümraniye", lat: 41.016, lng: 29.124, price: 175 },
  { district: "Kartal", lat: 40.906, lng: 29.172, price: 160 },
  { district: "Pendik", lat: 40.877, lng: 29.234, price: 155 },
  { district: "Tuzla", lat: 40.817, lng: 29.3, price: 150 },
  { district: "Başakşehir", lat: 41.093, lng: 28.802, price: 165 },
  { district: "Beylikdüzü", lat: 41.002, lng: 28.642, price: 148 },
  { district: "Avcılar", lat: 40.979, lng: 28.72, price: 158 },
  { district: "Bagcilar", lat: 41.039, lng: 28.856, price: 152 },
  { district: "Gaziosmanpaşa", lat: 41.062, lng: 28.912, price: 140 },
  { district: "Sarıyer", lat: 41.166, lng: 29.05, price: 200 },
  { district: "Maltepe", lat: 40.935, lng: 29.131, price: 168 },
  { district: "Ataşehir", lat: 40.992, lng: 29.124, price: 188 },
  { district: "Üsküdar", lat: 41.023, lng: 29.015, price: 205 },
  { district: "Fatih", lat: 41.019, lng: 28.949, price: 220 },
  { district: "Zeytinburnu", lat: 41.003, lng: 28.907, price: 178 },
  { district: "Bayrampaşa", lat: 41.045, lng: 28.904, price: 162 },
  { district: "Sultangazi", lat: 41.106, lng: 28.868, price: 138 },
  { district: "Kağıthane", lat: 41.079, lng: 28.975, price: 185 },
  { district: "Eyüpsultan", lat: 41.048, lng: 28.934, price: 172 },
  { district: "Çekmeköy", lat: 41.032, lng: 29.178, price: 158 },
  { district: "Sultanbeyli", lat: 40.961, lng: 29.264, price: 142 },
  { district: "Küçükçekmece", lat: 41.0, lng: 28.774, price: 155 },
  { district: "Büyükçekmece", lat: 41.02, lng: 28.585, price: 135 },
  { district: "Silivri", lat: 41.073, lng: 28.246, price: 125 },
  { district: "Arnavutköy", lat: 41.184, lng: 28.74, price: 130 },
];

const TYPE_ROTATION = ["standard", "standard", "fulfillment", "cold", "bonded"];

function featuresFor(type) {
  const base = ["24s Güvenlik", "Kamera", "Yükleme Rampası"];
  if (type === "cold") return [...base, "Soguk Zincir (+2/+8C)", "Nem Kontrolu"];
  if (type === "fulfillment") return [...base, "Paketleme", "Kargo Entegrasyonu"];
  if (type === "bonded") return [...base, "Gumruklu Alan", "Antrepo"];
  return [...base, "Forklift", "Raf Sistemi"];
}

export const ISTANBUL_WAREHOUSES = DISTRICTS.map((d, i) => {
  const type = TYPE_ROTATION[i % TYPE_ROTATION.length];
  const total = 800 + (i % 5) * 400;
  return {
    id: `ist-${i + 1}`,
    name: `İstanbul ${d.district} Depo Merkezi`,
    city: "İstanbul",
    district: d.district,
    address: `${d.district} OSB, Depo Blok ${String.fromCharCode(65 + (i % 6))}-${(i % 12) + 1}`,
    lat: d.lat,
    lng: d.lng,
    area_sqm: total,
    available_sqm: Math.round(total * 0.65),
    price_monthly: d.price,
    features: featuresFor(type),
    type,
    rating: Math.round((4.2 + (i % 8) * 0.1) * 10) / 10,
    available: true,
  };
});
