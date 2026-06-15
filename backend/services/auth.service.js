import bcrypt from "bcryptjs";
import { getSupabase } from "../config/supabase.js";
import { signToken } from "../utils/token.js";

const SALT_ROUNDS = 10;

/**
 * Kullanici kayit isi:
 *  - email benzersiz mi kontrol et
 *  - sifreyi bcrypt ile hash'le
 *  - Supabase'e yaz
 *  - token uret ve geri don
 */
export async function registerUser({ email, password, fullName }) {
  const supabase = getSupabase();
  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    const err = new Error("Bu e-posta ile zaten bir hesap var.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName || null,
    })
    .select("id, email, full_name, created_at")
    .single();

  if (error) {
    const err = new Error("Kullanici olusturulamadi: " + error.message);
    err.status = 500;
    throw err;
  }

  const token = signToken({ sub: data.id, email: data.email });
  return { user: toPublicUser(data), token };
}

/**
 * Giris isi:
 *  - email ile kullaniciyi bul
 *  - bcrypt ile sifreyi dogrula
 *  - token uret
 */
export async function loginUser({ email, password }) {
  const supabase = getSupabase();
  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, password_hash, role, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !user) {
    const err = new Error("E-posta veya şifre hatalı.");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error("E-posta veya şifre hatalı.");
    err.status = 401;
    throw err;
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { user: toPublicUser(user), token };
}

export async function updateUserProfile(userId, { fullName }) {
  const supabase = getSupabase();
  const name = String(fullName || "").trim();
  if (name.length < 2) {
    const err = new Error("Ad soyad en az 2 karakter olmali.");
    err.status = 422;
    throw err;
  }

  const { data, error } = await supabase
    .from("users")
    .update({ full_name: name })
    .eq("id", userId)
    .select("id, email, full_name, role, created_at")
    .single();

  if (error || !data) {
    const err = new Error("Profil guncellenemedi.");
    err.status = 500;
    throw err;
  }

  return toPublicUser(data);
}

/** Sifre hash'ini disari sizdirmadan kullanici nesnesi dondurur. */
function toPublicUser(row) {
  const email = row.email;
  let role = row.role || "user";
  if (email === "admin@kargotigo.com") role = "admin";
  return {
    id: row.id,
    email,
    fullName: row.full_name,
    role,
    createdAt: row.created_at,
  };
}
