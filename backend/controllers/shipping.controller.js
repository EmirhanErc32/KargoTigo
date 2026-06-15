import { quoteShipping } from "../services/shipping/index.js";
import { knownCities } from "../services/shipping/distance.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

/**
 * POST /api/shipping/quote
 * Onaylanan urun bilgilerine gore kargo seceneklerini ve fiyatlari doner.
 */
export const quote = asyncHandler(async (req, res) => {
  const {
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    origin,
    destination,
    distanceKm,
    international,
    analysisId,
  } = req.body || {};

  if (!weightKg || Number(weightKg) <= 0) {
    return fail(res, "Geçerli bir ağırlık (kg) gerekli.", 422);
  }

  const result = await quoteShipping({
    weightKg: Number(weightKg),
    lengthCm: numOrUndef(lengthCm),
    widthCm: numOrUndef(widthCm),
    heightCm: numOrUndef(heightCm),
    origin,
    destination,
    distanceKm: numOrUndef(distanceKm),
    international: Boolean(international),
  });

  return ok(res, {
    ...result,
    comparisonOnly: true,
    disclaimer:
      "Fiyatlar tahmini olup bilgi amaçlıdır. Gönderi ve ödeme seçilen kargo firması üzerinden yapılır.",
  });
});

/** GET /api/shipping/cities - bilinen sehir listesini doner (frontend dropdown'i icin). */
export const cities = asyncHandler(async (req, res) => {
  return ok(res, { cities: knownCities() });
});

function numOrUndef(v) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
