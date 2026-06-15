import {
  getCargoCatalog,
  quoteHeavyShipment,
} from "../services/heavy.service.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const catalog = asyncHandler(async (req, res) => {
  return ok(res, getCargoCatalog());
});

export const quote = asyncHandler(async (req, res) => {
  const result = quoteHeavyShipment(req.body || {});
  if (!result.feasible) {
    return fail(res, result.errors?.join(" ") || "Teklif olusturulamadi.", 422, result);
  }
  return ok(res, result);
});
