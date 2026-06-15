import {
  CARGO_TYPES,
  TRANSPORT_MODES,
  HEAVY_REQUIREMENTS,
  isModeAllowedForCargo,
} from "../data/heavy-cargo.js";
import { HEAVY_CARRIERS } from "../data/heavy-carriers.js";

const CITY_COORDS = {
  istanbul: { lat: 41.01, lng: 28.98 },
  ankara: { lat: 39.93, lng: 32.85 },
  izmir: { lat: 38.42, lng: 27.14 },
  bursa: { lat: 40.19, lng: 29.06 },
  antalya: { lat: 36.89, lng: 30.71 },
  adana: { lat: 37.0, lng: 35.32 },
  konya: { lat: 37.87, lng: 32.48 },
  gaziantep: { lat: 37.07, lng: 37.38 },
  mersin: { lat: 36.8, lng: 34.64 },
  trabzon: { lat: 41.0, lng: 39.72 },
  samsun: { lat: 41.28, lng: 36.33 },
  diyarbakir: { lat: 37.91, lng: 40.23 },
};

function normCity(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function estimateDistanceKm(origin, destination) {
  const o = CITY_COORDS[normCity(origin)] || CITY_COORDS.istanbul;
  const d = CITY_COORDS[normCity(destination)] || CITY_COORDS.ankara;
  return Math.round(haversineKm(o, d) * 1.25);
}

function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function getCargoCatalog() {
  return {
    cargoTypes: Object.values(CARGO_TYPES).map((c) => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      description: c.description,
      minWeightKg: c.minWeightKg,
      allowedModes: c.allowedModes.map((id) => ({
        id,
        label: TRANSPORT_MODES[id].label,
        emoji: TRANSPORT_MODES[id].emoji,
      })),
      defaultDims: c.defaultDims,
      defaultWeightKg: c.defaultWeightKg,
      requirements: HEAVY_REQUIREMENTS[c.id] || [],
    })),
    transportModes: Object.values(TRANSPORT_MODES),
  };
}

export function validateHeavyShipment(body) {
  const errors = [];
  const cargoType = body.cargoType;
  const cargo = CARGO_TYPES[cargoType];

  if (!cargo) errors.push("Gecerli yuk kategorisi secin.");
  if (!body.productTitle?.trim()) errors.push("Ürün başlığı gerekli.");
  if (!body.productDescription?.trim()) errors.push("Detaylı ürün açıklaması gerekli.");
  if (!body.origin?.trim()) errors.push("Çıkış şehri gerekli.");
  if (!body.destination?.trim()) errors.push("Varış şehri gerekli.");

  const weight = Number(body.weightKg);
  if (!weight || weight <= 0) errors.push("Ağırlık (kg) gerekli.");
  else if (cargo && weight < cargo.minWeightKg) {
    errors.push(`${cargo.label} icin minimum ${cargo.minWeightKg} kg gerekir.`);
  }

  const l = Number(body.lengthCm);
  const w = Number(body.widthCm);
  const h = Number(body.heightCm);
  if (!l || !w || !h) errors.push("Boyutlar (cm) gerekli.");

  if (cargoType === "car" || cargoType === "motorcycle") {
    if (!body.brand?.trim()) errors.push("Marka bilgisi gerekli.");
    if (!body.model?.trim()) errors.push("Model bilgisi gerekli.");
  }
  if (cargoType === "car") {
    if (!body.plate?.trim()) errors.push("Plaka bilgisi gerekli.");
    if (!body.year) errors.push("Model yılı gerekli.");
  }
  if (cargoType === "pallet") {
    const qty = Number(body.quantity);
    if (!qty || qty < 1) errors.push("Palet adedi gerekli.");
  }

  return { valid: errors.length === 0, errors, cargo };
}

const MODE_MULT = { bus: 0.85, truck: 1, trailer: 1.35, ship: 1.2, plane: 1.6 };

function calcCarrierPrice(carrier, modeId, { weightKg, distanceKm, cargoType, quantity = 1 }) {
  const mult = MODE_MULT[modeId] || 1;
  let weightFactor = 1 + Math.max(0, weightKg - 100) * 0.003;
  if (cargoType === "car") weightFactor *= 1.3;
  if (cargoType === "motorcycle") weightFactor *= 1.08;
  if (cargoType === "pallet") weightFactor *= 1 + (quantity - 1) * 0.15;

  const total = (carrier.baseFee + distanceKm * carrier.perKm * weightFactor) * mult;

  const days = {
    bus: Math.ceil(distanceKm / 400) + 1,
    truck: Math.ceil(distanceKm / 500) + 1,
    trailer: Math.ceil(distanceKm / 550) + 1,
    ship: Math.ceil(distanceKm / 300) + 3,
    plane: Math.ceil(distanceKm / 800) + 1,
  }[modeId];

  return {
    price: round(total, 2),
    currency: "TRY",
    estimatedDays: Math.max(1, days),
  };
}

export function quoteHeavyShipment(body) {
  const validation = validateHeavyShipment(body);
  if (!validation.valid) {
    return { feasible: false, errors: validation.errors };
  }

  const distanceKm = body.distanceKm
    ? Number(body.distanceKm)
    : estimateDistanceKm(body.origin, body.destination);

  const pkg = {
    weightKg: Number(body.weightKg),
    lengthCm: Number(body.lengthCm),
    widthCm: Number(body.widthCm),
    heightCm: Number(body.heightCm),
  };

  const cargo = validation.cargo;
  const options = [];
  const qty = Number(body.quantity) || 1;

  for (const carrier of HEAVY_CARRIERS) {
    if (!carrier.cargoTypes.includes(cargo.id)) continue;

    for (const modeId of carrier.modes) {
      if (!cargo.allowedModes.includes(modeId)) continue;

      const mode = TRANSPORT_MODES[modeId];
      const check = isModeAllowedForCargo(cargo.id, modeId, pkg, distanceKm);

      if (pkg.weightKg > carrier.maxWeightKg) {
        options.push({
          carrierId: carrier.id,
          carrier: carrier.name,
          color: carrier.color,
          modeId,
          mode: mode.label,
          emoji: mode.emoji,
          feasible: false,
          reasons: [`${carrier.name} kapasitesi (${carrier.maxWeightKg} kg) asildi.`],
        });
        continue;
      }

      if (!check.allowed) {
        options.push({
          carrierId: carrier.id,
          carrier: carrier.name,
          color: carrier.color,
          modeId,
          mode: mode.label,
          emoji: mode.emoji,
          feasible: false,
          reasons: [check.reason],
        });
        continue;
      }

      const pricing = calcCarrierPrice(carrier, modeId, {
        weightKg: pkg.weightKg,
        distanceKm,
        cargoType: cargo.id,
        quantity: qty,
      });

      options.push({
        carrierId: carrier.id,
        carrier: carrier.name,
        color: carrier.color,
        modeId,
        mode: mode.label,
        emoji: mode.emoji,
        feasible: true,
        price: pricing.price,
        currency: pricing.currency,
        estimatedDays: pricing.estimatedDays,
        note: modeNote(modeId, cargo.id),
      });
    }
  }

  const feasible = options.filter((o) => o.feasible);
  if (!feasible.length) {
    return {
      feasible: false,
      errors: ["Bu yük ve rota için uygun taşıma aracı bulunamadı."],
      distanceKm,
      options,
    };
  }

  feasible.sort((a, b) => a.price - b.price);

  return {
    feasible: true,
    cargoType: cargo.id,
    cargoLabel: cargo.label,
    origin: body.origin,
    destination: body.destination,
    distanceKm,
    product: {
      title: body.productTitle,
      description: body.productDescription,
      brand: body.brand,
      model: body.model,
      quantity: body.quantity,
    },
    requirements: HEAVY_REQUIREMENTS[cargo.id],
    options,
    comparisonOnly: true,
    disclaimer: "Fiyatlar tahmini olup bilgi amaçlıdır. Gönderi ve ödeme seçilen kargo firması üzerinden yapılır.",
    recommended: feasible[0],
  };
}

function modeNote(modeId, cargoType) {
  if (cargoType === "car" && modeId === "truck") return "Ozel arac tasiyici kamyon";
  if (cargoType === "car" && modeId === "ship") return "Ro-Ro gemi tasimasi";
  if (cargoType === "motorcycle" && modeId === "bus") return "Paketlenmis motosiklet — bagaj/kargo bolumu";
  if (modeId === "plane") return "Hızlı teslimat — boyut ve ağırlık limiti dikkat";
  return null;
}

