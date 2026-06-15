import crypto from "node:crypto";
import { ISTANBUL_POINTS, COURIER_LIMITS } from "../data/istanbul-points.js";

const ROAD_FACTOR = 1.35;

export function getDeliveryPoints() {
  return ISTANBUL_POINTS.map((p) => ({
    id: p.id,
    name: p.name,
    district: p.district,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
  }));
}

export function getPointById(id) {
  return ISTANBUL_POINTS.find((p) => p.id === id) || null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function roadDistanceKm(pickup, delivery) {
  const air = haversineKm(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  return round(air * ROAD_FACTOR, 2);
}

export function calcVolumeLiters(lengthCm, widthCm, heightCm) {
  const l = Number(lengthCm) || 0;
  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  if (!l || !w || !h) return 0;
  return round((l * w * h) / 1000, 2);
}

export function validatePackage({ weightKg, lengthCm, widthCm, heightCm }) {
  const errors = [];
  const weight = Number(weightKg);
  const l = Number(lengthCm);
  const w = Number(widthCm);
  const h = Number(heightCm);

  if (!weight || weight <= 0) errors.push("Ağırlık gerekli.");
  else if (weight > COURIER_LIMITS.maxWeightKg) {
    errors.push(`Maksimum agirlik ${COURIER_LIMITS.maxWeightKg} kg.`);
  }

  if (!l || !w || !h) errors.push("Boyutlar (cm) gerekli.");
  else {
    if (l > COURIER_LIMITS.maxLengthCm || w > COURIER_LIMITS.maxWidthCm || h > COURIER_LIMITS.maxHeightCm) {
      errors.push(`Maksimum boyut: ${COURIER_LIMITS.bucketReference}.`);
    }
    const vol = calcVolumeLiters(l, w, h);
    if (vol > COURIER_LIMITS.maxVolumeLiters) {
      errors.push(`Hacim ${vol}L — limit ${COURIER_LIMITS.maxVolumeLiters}L (10 kg kova).`);
    }
  }

  return { valid: errors.length === 0, errors, volumeLiters: calcVolumeLiters(l, w, h) };
}

export function validateRoute(pickupPointId, deliveryPointId) {
  const pickup = getPointById(pickupPointId);
  const delivery = getPointById(deliveryPointId);
  const errors = [];

  if (!pickup) errors.push("Gecersiz alim noktasi.");
  if (!delivery) errors.push("Gecersiz teslim noktasi.");
  if (pickup && delivery && pickup.id === delivery.id) {
    errors.push("Alim ve teslim noktasi ayni olamaz.");
  }

  let distanceKm = 0;
  if (pickup && delivery) {
    distanceKm = roadDistanceKm(pickup, delivery);
    if (distanceKm > COURIER_LIMITS.maxDistanceKm) {
      errors.push(`Mesafe ${distanceKm} km — maksimum ${COURIER_LIMITS.maxDistanceKm} km.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    pickup,
    delivery,
    distanceKm,
  };
}

/**
 * Fiyat: taban + mesafe + agirlik + hacim
 */
export function calculatePrice({ distanceKm, weightKg, volumeLiters }) {
  const baseFee     = 75;
  const distanceCost = round(distanceKm * 12, 2);
  const weightCost   = round(Math.max(0, weightKg - 1) * 8, 2);
  const volumeCost   = volumeLiters > 12 ? round((volumeLiters - 12) * 2, 2) : 0;
  const total        = round(baseFee + distanceCost + weightCost + volumeCost, 2);

  return {
    price: total,
    currency: "TRY",
    breakdown: {
      baseFee,
      distanceCost,
      weightCost,
      volumeCost,
      distanceKm: round(distanceKm, 2),
      weightKg: round(Number(weightKg), 2),
      volumeLiters: round(volumeLiters, 2),
    },
  };
}

export function quoteCourierShipment(body) {
  const route = validateRoute(body.pickupPointId, body.deliveryPointId);
  const pkg = validatePackage(body);

  const errors = [...route.errors, ...pkg.errors];
  if (errors.length) {
    return { feasible: false, errors, limits: COURIER_LIMITS };
  }

  const pricing = calculatePrice({
    distanceKm: route.distanceKm,
    weightKg: Number(body.weightKg),
    volumeLiters: pkg.volumeLiters,
  });

  const etaMinutes = Math.ceil(route.distanceKm * 3.5 + 20);

  return {
    feasible: true,
    pickup: { id: route.pickup.id, name: route.pickup.name, district: route.pickup.district },
    delivery: { id: route.delivery.id, name: route.delivery.name, district: route.delivery.district },
    distanceKm: route.distanceKm,
    volumeLiters: pkg.volumeLiters,
    estimatedMinutes: etaMinutes,
    limits: COURIER_LIMITS,
    ...pricing,
  };
}

const memOrders = [];

export function getMemOrders() {
  return memOrders;
}

export function generateDeliveryCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function buildOrderPayload(userId, body, pricing) {
  const pickup = getPointById(body.pickupPointId);
  const delivery = getPointById(body.deliveryPointId);

  return {
    user_id: userId,
    city: "Istanbul",
    origin_city: "Istanbul",
    pickup_point_id: body.pickupPointId,
    delivery_point_id: body.deliveryPointId,
    pickup_address: `${pickup.name} — ${pickup.address}, ${pickup.district}`,
    delivery_address: `${delivery.name} — ${delivery.address}, ${delivery.district}`,
    weight_kg: Number(body.weightKg),
    length_cm: Number(body.lengthCm),
    width_cm: Number(body.widthCm),
    height_cm: Number(body.heightCm),
    volume_liters: pricing.breakdown?.volumeLiters || calcVolumeLiters(body.lengthCm, body.widthCm, body.heightCm),
    package_description: body.packageDescription || null,
    sender_name: body.senderName,
    sender_phone: body.senderPhone,
    sender_tc: body.senderTc || null,
    recipient_name: body.recipientName,
    recipient_phone: body.recipientPhone,
    recipient_tc: body.recipientTc || null,
    urgency: "same_day",
    vehicle_type: "moto",
    carrier: "KargoTigo Sehir Ici",
    price: pricing.price,
    price_breakdown: pricing.breakdown,
    distance_km: pricing.breakdown?.distanceKm,
    payment_status: "pending",
    status: "pending_payment",
  };
}

export function buildPaidOrderUpdate(pickupCode, deliveryCode, trackingNumber) {
  return {
    pickup_code: pickupCode,
    delivery_code: deliveryCode,
    tracking_number: trackingNumber,
    payment_status: "paid",
    paid_at: new Date().toISOString(),
    status: "order_received",
  };
}

/** Kurye rotasi: alim → teslim arasi ara noktalar */
export function buildCourierRoute(pickupPointId, deliveryPointId) {
  const pickup = getPointById(pickupPointId);
  const delivery = getPointById(deliveryPointId);
  if (!pickup || !delivery) return [];

  const midLat = (pickup.lat + delivery.lat) / 2;
  const midLng = (pickup.lng + delivery.lng) / 2;

  return [
    { lat: pickup.lat, lng: pickup.lng, label: pickup.name, type: "pickup" },
    { lat: midLat + 0.004, lng: midLng - 0.003, label: "Transfer", type: "transit" },
    { lat: midLat - 0.002, lng: midLng + 0.005, label: "Dagitim", type: "transit" },
    { lat: delivery.lat, lng: delivery.lng, label: delivery.name, type: "delivery" },
  ];
}

function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
