import { verifyToken } from "../utils/token.js";
import { fail } from "../utils/http.js";

/**
 * Korunan route'lar icin: "Authorization: Bearer <token>" header'ini
 * dogrular, gecerliyse req.user'i doldurur.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return fail(res, "Yetkilendirme tokeni gerekli.", 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    return fail(res, "Gecersiz veya suresi dolmus token.", 401);
  }
}

/**
 * Token varsa req.user'i doldurur, yoksa hata vermeden devam eder.
 * Hem giris yapmis hem yapmamis kullanicilara izin veren route'lar icin.
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.sub, email: decoded.email };
    } catch {
      // Gecersiz token'i sessizce yok say
    }
  }
  next();
}
