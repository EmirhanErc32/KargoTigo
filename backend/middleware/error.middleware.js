import multer from "multer";
import { fail } from "../utils/http.js";

/** 404 - tanimsiz route'lar icin. */
export function notFound(req, res) {
  return fail(res, "Istenen kaynak bulunamadi: " + req.originalUrl, 404);
}

/** Merkezi hata yakalayici. Tum route'lardan gelen hatalar burada islenir. */
export function errorHandler(err, req, res, _next) {
  // Multer (dosya yukleme) hatalari
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "Dosya cok buyuk (en fazla 8 MB)."
        : "Dosya yukleme hatasi: " + err.message;
    return fail(res, msg, 422);
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error("[HATA]", err);
  }
  return fail(res, err.message || "Sunucu hatasi.", status);
}
