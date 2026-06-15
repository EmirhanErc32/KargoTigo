import { registerUser, loginUser, updateUserProfile } from "../services/auth.service.js";
import { getQuotaStatus } from "../services/quota.service.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return fail(res, "Gecerli bir e-posta girin.", 422);
  }
  if (!password || password.length < 6) {
    return fail(res, "Şifre en az 6 karakter olmalı.", 422);
  }
  if (!fullName || String(fullName).trim().length < 2) {
    return fail(res, "Ad soyad en az 2 karakter olmali.", 422);
  }

  const result = await registerUser({ email, password, fullName: String(fullName).trim() });
  const quota = await getQuotaStatus(result.user.id);
  return ok(res, { ...result, quota }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return fail(res, "E-posta ve şifre zorunlu.", 422);
  }

  const result = await loginUser({ email, password });
  const quota = await getQuotaStatus(result.user.id);
  return ok(res, { ...result, quota });
});

/** Token gecerliyse mevcut kullaniciyi doner (requireAuth'tan sonra). */
export const me = asyncHandler(async (req, res) => {
  const { getSupabase } = await import("../config/supabase.js");
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_premium, created_at")
    .eq("id", req.user.id)
    .single();
  const user = row
    ? {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.email === "admin@kargotigo.com" ? "admin" : (row.role || "user"),
        createdAt: row.created_at,
      }
    : req.user;
  const quota = await getQuotaStatus(req.user.id);
  return ok(res, { user, quota });
});

export const quota = asyncHandler(async (req, res) => {
  return ok(res, { quota: await getQuotaStatus(req.user.id) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName } = req.body || {};
  const user = await updateUserProfile(req.user.id, { fullName });
  const quota = await getQuotaStatus(req.user.id);
  return ok(res, { user, quota });
});
