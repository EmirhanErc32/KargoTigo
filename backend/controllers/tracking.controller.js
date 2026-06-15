import { lookupTracking, listUserTrackings } from "../services/tracking.service.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const track = asyncHandler(async (req, res) => {
  const code = req.params.code || req.query.code;
  if (!code) return fail(res, "Takip numarasi gerekli.", 422);

  const result = await lookupTracking(code, req.user?.id || null);
  if (!result) return fail(res, "Takip numarasi bulunamadi.", 404);

  return ok(res, { tracking: result });
});

export const myTrackings = asyncHandler(async (req, res) => {
  const list = await listUserTrackings(req.user.id);
  return ok(res, { trackings: list });
});
