import { env } from "../config/env.js";
import { analyzeImage } from "../services/gemini.service.js";
import { analyzeImageViaN8n } from "../services/n8n.service.js";
import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

function isFailedAnalysis(analysis) {
  if (!analysis) return true;
  if (analysis.error) return true;
  if (analysis.confidence === 0 && !analysis.product_name && analysis.notes) return true;
  return false;
}

/** n8n basarisiz olursa (429 vb.) backend'deki GEMINI_API_KEY ile dogrudan dene. */
async function runAnalysis(file, hint) {
  if (env.ai.provider !== "n8n") {
    return analyzeImage(file.buffer, file.mimetype, hint);
  }

  let n8nResult = null;
  try {
    n8nResult = await analyzeImageViaN8n(file.buffer, file.mimetype, hint);
    if (!isFailedAnalysis(n8nResult.analysis)) return n8nResult;
  } catch (err) {
    if (!env.gemini.apiKey) throw err;
    console.warn("[analyze] n8n hatasi, dogrudan Gemini deneniyor:", err.message);
  }

  if (env.gemini.apiKey) {
    console.warn("[analyze] n8n basarisiz — dogrudan Gemini API kullaniliyor (yedek modeller denenir).");
    try {
      return await analyzeImage(file.buffer, file.mimetype, hint);
    } catch (err) {
      err.message = err.message || "AI analizi başarısız.";
      throw err;
    }
  }

  if (n8nResult) return n8nResult;

  const err = new Error(
    "n8n calismadi. backend/.env dosyasina GEMINI_API_KEY ekleyin."
  );
  err.status = 503;
  throw err;
}

/**
 * POST /api/analyze
 * Fotografi alir, Gemini ile analiz eder, sonucu (kaynaklariyla) doner
 * ve istege bagli olarak veritabanina kaydeder.
 */
export const analyze = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, "Lütfen bir görsel yükleyin ('image' alani).", 422);
  }

  const hint = req.body?.hint || "";
  const { analysis, sources, rawText } = await runAnalysis(req.file, hint);

  if (!analysis) {
    return fail(res, "Analiz sonucu çözümlenemedi. Lütfen tekrar deneyin.", 502, {
      rawText,
    });
  }

  // n8n/Gemini hata dondurduyse bos form yerine anlamli hata ver
  if (analysis.error || (analysis.confidence === 0 && !analysis.product_name && analysis.notes)) {
    const msg = analysis.notes || "AI analizi başarısız oldu.";
    const status = String(msg).includes("429") || String(msg).includes("kota") ? 429 : 502;
    return fail(res, msg, status, { analysis, sources });
  }

  let analysisId = null;

  // Kullanici giris yapmissa ve Supabase varsa kaydet
  if (req.user && isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("analyses")
      .insert({
        user_id: req.user.id,
        product_name: analysis.product_name ?? null,
        brand: analysis.brand ?? null,
        model: analysis.model ?? null,
        category: analysis.category ?? null,
        weight_kg: numOrNull(analysis.weight_kg),
        length_cm: numOrNull(analysis.length_cm),
        width_cm: numOrNull(analysis.width_cm),
        height_cm: numOrNull(analysis.height_cm),
        confidence: numOrNull(analysis.confidence),
        sources,
        raw_response: { rawText },
      })
      .select("id")
      .single();

    if (!error && data) analysisId = data.id;
  }

  return ok(res, { analysisId, analysis, sources });
});

/**
 * PATCH /api/analyze/:id/confirm
 * Kullanici, AI sonucunu (gerekirse duzelterek) onaylar.
 */
export const confirmAnalysis = asyncHandler(async (req, res) => {
  if (!isSupabaseConfigured()) {
    return fail(res, "Veritabanı yapılandırılmamış.", 503);
  }
  const supabase = getSupabase();
  const { id } = req.params;
  const patch = req.body || {};

  const update = {
    confirmed: true,
    product_name: patch.product_name,
    brand: patch.brand,
    model: patch.model,
    weight_kg: numOrNull(patch.weight_kg),
    length_cm: numOrNull(patch.length_cm),
    width_cm: numOrNull(patch.width_cm),
    height_cm: numOrNull(patch.height_cm),
  };
  // undefined alanlari temizle (sadece gonderilenleri guncelle)
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

  const { data, error } = await supabase
    .from("analyses")
    .update(update)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return fail(res, "Analiz bulunamadı veya guncellenemedi.", 404);
  }

  return ok(res, { analysis: data });
});

function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
