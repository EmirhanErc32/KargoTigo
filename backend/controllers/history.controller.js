import { getFullHistory, getWarehouseHistory, getQueryHistory, getCourierHistory } from "../services/history.service.js";
import { ok, asyncHandler } from "../utils/http.js";

export const all = asyncHandler(async (req, res) => {
  const history = await getFullHistory(req.user.id);
  return ok(res, { history });
});

export const warehouses = asyncHandler(async (req, res) => {
  return ok(res, { items: await getWarehouseHistory(req.user.id) });
});

export const queries = asyncHandler(async (req, res) => {
  return ok(res, { items: await getQueryHistory(req.user.id) });
});

export const courier = asyncHandler(async (req, res) => {
  return ok(res, { items: await getCourierHistory(req.user.id) });
});
