import { env } from "../config/env.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `Sen bir lojistik analiz asistanisin. Sana bir urun fotografi verilecek.
Gorevin:
1. Fotograftaki urunu tani (marka, model, kategori).
2. Bu urunun gercekci teknik ozelliklerini bul:
   - Ağırlık (kg)
   - Boyutlar (uzunluk x genislik x yukseklik, cm)
3. Bilgileri urunun resmi/guvenilir kaynaklarindan dogrula.

Cevabini SADECE asagidaki JSON formatinda, baska hicbir aciklama eklemeden ver.
Bulamadigin sayisal alanlar icin null kullan. Tahmin ediyorsan confidence dusur.

{
  "product_name": "string (orn: Bulasik Makinesi)",
  "brand": "string veya null",
  "model": "string veya null",
  "category": "string (orn: Beyaz Esya, Elektronik, Mobilya)",
  "weight_kg": number veya null,
  "length_cm": number veya null,
  "width_cm": number veya null,
  "height_cm": number veya null,
  "confidence": number (0 ile 1 arasi),
  "notes": "string - kisa aciklama / belirsizlikler"
}`;

function modelChain() {
  const primary = env.gemini.model || "gemini-2.5-flash";
  return [...new Set([primary, "gemini-2.5-flash", "gemini-flash-latest"])];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableStatus(status) {
  return status === 429 || status === 503 || status === 500;
}

export function friendlyGeminiError(raw = "", status = 502) {
  const text = String(raw);
  if (status === 429 || text.includes("429") || text.includes("RESOURCE_EXHAUSTED") || text.includes("quota")) {
    return "AI kotasi dolu. Birkac dakika bekleyip tekrar deneyin veya olculeri manuel girin.";
  }
  if (status === 503 || text.includes("503") || text.includes("UNAVAILABLE") || text.includes("high demand")) {
    return "Gemini su an yogun. 1-2 dakika sonra tekrar deneyin veya olculeri manuel girin.";
  }
  if (text.includes("401") || text.includes("403") || text.includes("API key")) {
    return "Gemini API anahtari gecersiz. backend/.env dosyasindaki GEMINI_API_KEY degerini kontrol edin.";
  }
  return "AI analizi su an calismiyor. Olculeri manuel girebilirsiniz.";
}

export async function analyzeImage(imageBuffer, mimeType, hint = "") {
  if (!env.gemini.apiKey) {
    const err = new Error("GEMINI_API_KEY tanimli degil. backend/.env dosyasini kontrol edin.");
    err.status = 503;
    throw err;
  }

  const base64 = imageBuffer.toString("base64");
  const userText = hint ? `${SYSTEM_PROMPT}\n\nKullanici ipucu: ${hint}` : SYSTEM_PROMPT;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: userText },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2 },
  };

  let lastRaw = "";
  let lastStatus = 502;

  for (const model of modelChain()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `${API_BASE}/${model}:generateContent?key=${env.gemini.apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        const data = await resp.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.map((p) => p.text || "").join("\n").trim() || "";
        const analysis = parseAnalysisJson(rawText);
        if (!analysis) {
          lastRaw = rawText;
          break;
        }
        return { analysis, sources: extractSources(candidate), rawText, modelUsed: model };
      }

      lastRaw = await resp.text();
      lastStatus = resp.status;
      if (isRetryableStatus(resp.status)) {
        await sleep((attempt + 1) * 1500);
        continue;
      }
      break;
    }
  }

  const err = new Error(friendlyGeminiError(lastRaw, lastStatus));
  err.status = lastStatus === 429 ? 429 : 503;
  throw err;
}

function parseAnalysisJson(text) {
  if (!text) return null;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    candidate = candidate.slice(start, end + 1);
  }
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .map((c) => c.web)
    .filter(Boolean)
    .map((w) => ({ title: w.title || w.uri, uri: w.uri }));
  const seen = new Set();
  return sources.filter((s) => {
    if (seen.has(s.uri)) return false;
    seen.add(s.uri);
    return true;
  });
}
