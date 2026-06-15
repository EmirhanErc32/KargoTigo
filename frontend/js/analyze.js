import { apiFetch } from "./api.js";

/**
 * Bir gorseli backend'e gonderip Gemini analizini alir.
 * @param {File} file
 * @param {string} hint - opsiyonel kullanici ipucu
 */
export function analyzeImage(file, hint = "") {
  const fd = new FormData();
  fd.append("image", file);
  if (hint) fd.append("hint", hint);
  return apiFetch("/api/analyze", { method: "POST", body: fd });
}

/**
 * Kullanicinin (gerekirse duzelterek) onayladigi urun bilgilerini kaydeder.
 */
export function confirmAnalysis(analysisId, specs) {
  return apiFetch(`/api/analyze/${analysisId}/confirm`, {
    method: "PATCH",
    body: specs,
  });
}
