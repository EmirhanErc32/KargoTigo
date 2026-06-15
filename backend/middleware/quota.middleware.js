import { consumeQueryQuota } from "../services/quota.service.js";
import { fail } from "../utils/http.js";

export function queryQuota(endpoint) {
  return async (req, res, next) => {
    if (!req.user?.id) return next();

    const result = await consumeQueryQuota(req.user.id, endpoint);
    res.locals.quota = result;

    if (!result.allowed) {
      return fail(
        res,
        "AI analiz limitiniz doldu (5 hak). 3 saatte bir yeni hak tanimlanir.",
        429,
        { quota: result }
      );
    }
    next();
  };
}
