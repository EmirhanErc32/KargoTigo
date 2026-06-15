import { apiFetch } from "./api.js";

/** Bilinen sehir listesini getirir (dropdown icin). */
export function loadCities() {
  return apiFetch("/api/shipping/cities", { auth: false });
}

/**
 * Urun bilgileri + guzergaha gore kargo tekliflerini getirir.
 * @param {object} params {weightKg, lengthCm, widthCm, heightCm, origin, destination, distanceKm, international, analysisId}
 */
export function quoteShipping(params) {
  return apiFetch("/api/shipping/quote", { method: "POST", body: params });
}
