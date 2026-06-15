import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/**
 * Supabase istemcisi (service_role anahtariyla).
 * Bu anahtar RLS'i bypass eder; SADECE backend'de kullanilmalidir.
 *
 * Ayarlar eksikse null doner; servisler bunu kontrol edip anlamli hata verir.
 */
let supabase = null;

if (env.supabase.url && env.supabase.serviceRoleKey) {
  supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase yapilandirilmamis. .env dosyasinda SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ayarlayin."
    );
  }
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
