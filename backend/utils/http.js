/**
 * Tutarli JSON cevaplari icin yardimcilar.
 */
export function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

export function fail(res, message, status = 400, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

/**
 * Async route handler'lari try/catch ile sarmalar; hatalari
 * merkezi error middleware'e iletir (modulerlik + temizlik).
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
