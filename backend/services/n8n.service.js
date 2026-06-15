import { env } from "../config/env.js";

/**
 * Gorseli n8n webhook'una gonderip analiz sonucunu alir.
 *
 * Backend, fotografi base64 olarak su govdeyle POST eder:
 *   {
 *     "image": "<base64>",        // ham base64 (data: oneki YOK)
 *     "mimeType": "image/jpeg",
 *     "hint": "kullanici ipucu"
 *   }
 *
 * n8n workflow'u (Webhook -> Gemini -> Respond to Webhook) su formatta
 * JSON dondurmelidir:
 *   {
 *     "product_name", "brand", "model", "category",
 *     "weight_kg", "length_cm", "width_cm", "height_cm",
 *     "confidence", "notes",
 *     "sources": [{ "title", "uri" }]
 *   }
 *
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} [hint]
 * @returns {Promise<{analysis: object, sources: Array, rawText: string}>}
 */
export async function analyzeImageViaN8n(imageBuffer, mimeType, hint = "") {
  if (!env.n8n.webhookUrl) {
    const err = new Error(
      "N8N_WEBHOOK_URL tanimli degil. .env dosyasinda n8n webhook adresini ayarlayin."
    );
    err.status = 503;
    throw err;
  }

  const headers = { "Content-Type": "application/json" };
  // Opsiyonel webhook guvenligi (gizli header)
  if (env.n8n.authHeader && env.n8n.authValue) {
    headers[env.n8n.authHeader] = env.n8n.authValue;
  }

  const body = {
    image: imageBuffer.toString("base64"),
    mimeType,
    hint,
  };

  let resp;
  try {
    resp = await fetch(env.n8n.webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = new Error("n8n webhook'una ulasilamadi: " + e.message);
    err.status = 502;
    throw err;
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(
      `n8n webhook hatasi (${resp.status}): ${text.slice(0, 300)}`
    );
    err.status = 502;
    throw err;
  }

  const rawText = await resp.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!data) {
    const preview = rawText ? rawText.slice(0, 300) : "(bos)";
    const err = new Error(
      `n8n webhook'undan gecersiz/bos JSON dondu. n8n Executions sekmesini kontrol edin. Ham cevap: ${preview}`
    );
    err.status = 502;
    throw err;
  }

  // n8n bazen sonucu bir dizi veya { data: ... } / { json: ... } icinde dondurur.
  const analysis = normalizeAnalysis(data);
  const sources = Array.isArray(analysis.sources) ? analysis.sources : [];
  delete analysis.sources;

  return { analysis, sources, rawText: JSON.stringify(data) };
}

/**
 * n8n cevabini esnek sekilde tek bir analiz nesnesine indirger.
 * Farkli n8n "Respond" yapilandirmalarina dayanikli olmasi icin.
 */
function normalizeAnalysis(data) {
  let obj = data;
  if (Array.isArray(obj)) obj = obj[0] ?? {};
  if (obj && typeof obj === "object") {
    if (obj.json && typeof obj.json === "object") obj = obj.json;
    else if (obj.data && typeof obj.data === "object") obj = obj.data;
    else if (obj.body && typeof obj.body === "object") obj = obj.body;
  }
  return { ...obj };
}
