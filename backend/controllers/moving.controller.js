import {
  createMovingOrder, payMovingOrder, getUserMovingOrders,
  listAllMovingOrders, assignMovingOrder,
  getMovingOrdersForNakliyeci, verifyMovingCode,
} from "../services/moving.service.js";
import { requireAdminUser } from "../services/admin.service.js";
import { fail } from "../utils/http.js";

export async function postMovingOrder(req, res) {
  try {
    const { movingType, roomSize, originFloor, destFloor, packingService,
      originAddress, destAddress, contactName, contactPhone, distanceKm } = req.body;
    const result = await createMovingOrder({
      userId: req.user.id, movingType, roomSize, originFloor, destFloor,
      packingService, originAddress, destAddress, contactName, contactPhone,
      distanceKm: distanceKm ?? null,
    });
    res.json(result);
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function postPayMoving(req, res) {
  try {
    const { orderId } = req.body;
    const result = await payMovingOrder(orderId, req.user.id);
    res.json(result);
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function getMyMoving(req, res) {
  try {
    const data = await getUserMovingOrders(req.user.id);
    res.json({ orders: data });
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function adminListMoving(req, res) {
  try {
    await requireAdminUser(req.user.id);
    const data = await listAllMovingOrders({ status: req.query.status });
    res.json({ orders: data });
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function adminAssignMoving(req, res) {
  try {
    await requireAdminUser(req.user.id);
    const { orderId, nakliyeciAccountId } = req.body;
    const data = await assignMovingOrder(orderId, nakliyeciAccountId);
    res.json({ order: data });
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function nakliyeciOrders(req, res) {
  try {
    const accountId = req.branch?.id;
    const data = await getMovingOrdersForNakliyeci(accountId);
    res.json({ orders: data });
  } catch (e) { fail(res, e.message, e.status || 500); }
}

export async function nakliyeciVerify(req, res) {
  try {
    const { orderId, code } = req.body;
    const result = await verifyMovingCode({ accountId: req.branch?.id, orderId, code });
    res.json(result);
  } catch (e) { fail(res, e.message, e.status || 500); }
}
