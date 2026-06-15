/**
 * Uygulama yapilandirmasi.
 * Backend ayni sunucudan servis ediliyorsa API_BASE bos kalabilir.
 * Frontend'i ayri (orn: Live Server :5500) calistiriyorsaniz
 * backend adresini yazin: "http://localhost:3000"
 */
export const CONFIG = {
  API_BASE: window.location.port === "3000" ? "" : "http://localhost:3000",
  TOKEN_KEY: "kargotigo_token",
  USER_KEY: "kargotigo_user",

  // Supabase (anon key - frontend'de guvenle kullanilabilir, RLS ile korunur)
  SUPABASE_URL: "https://rsazcxhnnxpqlufnxitv.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYXpjeGhubnhwcWx1Zm54aXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTMxOTcsImV4cCI6MjA5NjMyOTE5N30.qZ4JGhS3Mik00xAWpTynjyxrgG7QySw7G_1zWcPBuLY",
};
