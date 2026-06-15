import { CARRIERS } from "./carriers.js";
import { estimateDistanceKm } from "./distance.js";

/**
 * YERLESIK FIYATLANDIRMA MOTORU
 * Gercek bir kargo API'si yoksa devreye girer. Agirlik, hacim (desi),
 * mesafe ve her KARGO FIRMASININ tarifesine gore fiyat hesaplar.
 *
 * Her firma icin, gonderinin ozelligine gore kullanilacak tasima araci
 * (motosiklet/van/kamyon/ucak/gemi) da otomatik belirlenir.
 *
 * @returns {{distanceKm, distanceEstimated, international, chargeableDesi, options:Array}}
 */
export function quoteInternal(p) {
  const weight = Math.max(0, Number(p.weightKg) || 0);
  const L = Number(p.lengthCm) || 0;
  const W = Number(p.widthCm) || 0;
  const H = Number(p.heightCm) || 0;

  // Mesafeyi belirle
  let distanceKm = Number(p.distanceKm) || 0;
  let distanceEstimated = false;
  if (!distanceKm) {
    const est = estimateDistanceKm(p.origin, p.destination);
    if (est) {
      distanceKm = est;
      distanceEstimated = true;
    } else {
      distanceKm = p.international ? 2000 : 500;
      distanceEstimated = true;
    }
  }

  const international = Boolean(p.international) || distanceKm > 1500;

  const options = CARRIERS.map((c) => {
    // Desi (hacimsel agirlik) ve ucretlendirilen miktar
    const desi = (L * W * H) / c.volumetricDivisor;
    const chargeable = Math.max(weight, desi);

    // Bu gonderi icin uygun tasima aracini sec
    const vehicle = pickVehicle({ weight, distanceKm, international });

    // Uygunluk kontrolu
    const reasons = [];
    if (weight > c.maxWeightKg) reasons.push("agirlik limiti asildi");
    if (desi > c.maxDesi) reasons.push("desi limiti asildi");
    if (c.scope === "domestic" && international)
      reasons.push("yurt disi gonderi yapmaz");
    if (c.scope === "international" && !international)
      reasons.push("yurt ici gonderi yapmaz");

    const feasible = reasons.length === 0;

    // Fiyat = sabit + desi maliyeti + mesafe maliyeti
    const price = c.baseFee + chargeable * c.perDesi + distanceKm * c.perKm;

    const estimatedDays =
      c.handlingDays + Math.max(1, Math.ceil(distanceKm / c.speedKmDay));

    return {
      carrierId: c.id,
      carrier: c.name,
      color: c.color,
      vehicle: vehicle.type,
      vehicleLabel: vehicle.label,
      feasible,
      reasons,
      chargeableDesi: round(chargeable, 1),
      desi: round(desi, 1),
      estimatedDays,
      currency: "TRY",
      price: round(price, 2),
      breakdown: {
        baseFee: c.baseFee,
        desiCost: round(chargeable * c.perDesi, 2),
        distanceCost: round(distanceKm * c.perKm, 2),
      },
    };
  });

  // Uygun olanlari fiyata gore sirala, uygun olmayanlari sona at
  options.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return a.price - b.price;
  });

  const chargeableDesi = options.length ? options[0].chargeableDesi : 0;

  return {
    distanceKm: round(distanceKm, 0),
    distanceEstimated,
    international,
    chargeableDesi,
    options,
  };
}

/**
 * Gonderinin agirlik/mesafe/uluslararasi durumuna gore en mantikli
 * tasima aracini belirler (arayuzde firma karti uzerinde gosterilir).
 */
function pickVehicle({ weight, distanceKm, international }) {
  if (international) {
    // Cok agir uluslararasi yuk -> deniz; aksi halde hava
    return weight > 1000
      ? { type: "gemi", label: "Deniz Kargo" }
      : { type: "ucak", label: "Hava Kargo" };
  }
  if (distanceKm <= 60 && weight <= 15) {
    return { type: "motosiklet", label: "Motosiklet Kurye" };
  }
  if (weight > 800) {
    return { type: "kamyon", label: "Kamyon" };
  }
  if (distanceKm > 250) {
    return { type: "kamyon", label: "Kamyon" };
  }
  return { type: "van", label: "Panelvan" };
}

function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
