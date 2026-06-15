import {
  getCountries,
  getCountryDocs,
  quoteInternational,
} from "../services/international.service.js";
import { createTrackingRecord } from "../services/tracking.service.js";
import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const countries = asyncHandler(async (req, res) => {
  return ok(res, { countries: getCountries() });
});

export const docs = asyncHandler(async (req, res) => {
  const info = getCountryDocs(req.params.code);
  if (!info) return fail(res, "Ulke bulunamadi.", 404);
  return ok(res, info);
});

export const quote = asyncHandler(async (req, res) => {
  const { weightKg, lengthCm, widthCm, heightCm, origin, countryCode, distanceKm } = req.body || {};
  if (!weightKg || Number(weightKg) <= 0) return fail(res, "Gecerli agirlik (kg) gerekli.", 422);
  if (!countryCode) return fail(res, "Hedef ulke secimi gerekli.", 422);

  const result = quoteInternational({
    weightKg: Number(weightKg),
    lengthCm, widthCm, heightCm,
    origin, countryCode, distanceKm,
  });

  return ok(res, result);
});

export const createShipment = asyncHandler(async (req, res) => {
  const {
    weightKg, lengthCm, widthCm, heightCm,
    origin, countryCode, carrierId, carrier, price, currency, estimatedDays,
  } = req.body || {};

  if (!carrier || !price) return fail(res, "Kargo firmasi secimi gerekli.", 422);

  const result = quoteInternational({
    weightKg: Number(weightKg),
    lengthCm, widthCm, heightCm,
    origin, countryCode,
  });

  const country = result.country;
  const shipment = {
    user_id: req.user.id,
    origin: origin || "Istanbul",
    destination: country?.name || "Yurt Disi",
    distance_km: result.distanceKm,
    vehicle_type: "ucak",
    carrier,
    price: Number(price),
    currency: currency || "TRY",
    estimated_days: estimatedDays || country?.transitDays || 5,
    service_type: "international",
    details: { countryCode, carrierId, chargeableDesi: result.chargeableDesi },
    status: "order_received",
  };

  let saved = { ...shipment, id: `sh-${Date.now()}` };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("shipments")
      .insert(shipment)
      .select("*")
      .single();
    if (error) return fail(res, "Gonderi kaydedilemedi: " + error.message, 500);
    saved = data;
  }

  const tracking = await createTrackingRecord({
    userId: req.user.id,
    serviceType: "international",
    referenceId: saved.id,
    referenceTable: "shipments",
    carrier,
    origin: shipment.origin,
    destination: shipment.destination,
    estimatedHours: (shipment.estimated_days || 5) * 24,
  });

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    await supabase
      .from("shipments")
      .update({ tracking_number: tracking.trackingNumber, status: "order_received" })
      .eq("id", saved.id);
    saved.tracking_number = tracking.trackingNumber;
  } else {
    saved.tracking_number = tracking.trackingNumber;
  }

  return ok(res, { shipment: saved, tracking, docs: result.docs });
});
