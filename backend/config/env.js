import dotenv from "dotenv";

dotenv.config();

/**
 * Tum ortam degiskenlerini tek bir yerden, tip donusumleriyle birlikte sunar.
 * Boylece kod icinde process.env'e dagilmaktan kurtuluruz (modulerlik).
 */
export const env = {
  port: Number(process.env.PORT) || 3000,
  corsOrigin: (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  jwt: {
    secret: process.env.JWT_SECRET || "degistir_bu_gizli_anahtari",
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  },

  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  ai: {
    provider: process.env.AI_PROVIDER || "n8n", // "n8n" | "gemini"
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || "",
    authHeader: process.env.N8N_WEBHOOK_AUTH_HEADER || "",
    authValue: process.env.N8N_WEBHOOK_AUTH_VALUE || "",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },

  shipping: {
    provider: process.env.SHIPPING_PROVIDER || "internal",
    apiUrl: process.env.SHIPPING_API_URL || "",
    apiKey: process.env.SHIPPING_API_KEY || "",
  },
};

/**
 * Acilista kritik degiskenlerin var olup olmadigini kontrol eder.
 * Eksikse uyari basar ama uygulamayi durdurmaz (gelistirme kolayligi).
 */
export function validateEnv() {
  const warnings = [];

  if (!process.env.JWT_SECRET) {
    warnings.push("JWT_SECRET tanimli degil - varsayilan (guvensiz) deger kullaniliyor.");
  }
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    warnings.push(
      "SUPABASE_SERVICE_ROLE_KEY eksik - kayit/giris ve veritabani kaydi calismayacak."
    );
  }
  if (env.ai.provider === "n8n" && !env.n8n.webhookUrl) {
    warnings.push("N8N_WEBHOOK_URL eksik - gorsel analiz ozelligi calismayacak.");
  }
  if (env.ai.provider === "n8n" && !env.gemini.apiKey) {
    warnings.push(
      "GEMINI_API_KEY eksik - n8n 429/hata verirse yedek olarak kullanilamaz."
    );
  }
  if (env.ai.provider === "gemini" && !env.gemini.apiKey) {
    warnings.push("GEMINI_API_KEY eksik - gorsel analiz ozelligi calismayacak.");
  }

  if (warnings.length) {
    console.warn("\n[UYARI] Ortam degiskeni kontrolu:");
    warnings.forEach((w) => console.warn("  - " + w));
    console.warn("  -> .env dosyanizi kontrol edin (.env.example'a bakin).\n");
  }
}
