import {
  getDeliveryPoints, quoteCourierShipment, buildOrderPayload,
  buildPaidOrderUpdate, buildCourierRoute, generateDeliveryCode,
  getMemOrders, getPointById,
} from "../services/courier.service.js";
import { ISTANBUL_POINTS } from "../data/istanbul-points.js";
import { createTrackingRecord } from "../services/tracking.service.js";
import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const points = asyncHandler(async (req, res) => {
  const { COURIER_LIMITS: lim } = await import("../data/istanbul-points.js");
  return ok(res, { points: getDeliveryPoints(), limits: lim });
});

export const limits = asyncHandler(async (req, res) => {
  const { COURIER_LIMITS: lim } = await import("../data/istanbul-points.js");
  return ok(res, { limits: lim });
});

export const quote = asyncHandler(async (req, res) => {
  const result = quoteCourierShipment(req.body || {});
  if (!result.feasible) {
    return fail(res, result.errors.join(" "), 422, { errors: result.errors, limits: result.limits });
  }
  return ok(res, result);
});

/** Odeme oncesi siparis taslaği */
export const checkout = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const required = ["pickupPointId", "deliveryPointId", "weightKg", "lengthCm", "widthCm", "heightCm", "senderName", "senderPhone", "recipientName", "recipientPhone"];
  for (const k of required) {
    if (!body[k]) return fail(res, `Eksik alan: ${k}`, 422);
  }

  const quote = quoteCourierShipment(body);
  if (!quote.feasible) {
    return fail(res, quote.errors.join(" "), 422, { errors: quote.errors });
  }

  const orderData = buildOrderPayload(req.user.id, body, quote);
  let saved = { ...orderData, id: `co-${Date.now()}` };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("courier_orders").insert(orderData).select("*").single();
    if (error) {
      const schemaHint = /column|schema cache/i.test(error.message)
        ? " Supabase SQL Editor'da database/migrate-courier-orders.sql dosyasini calistirin."
        : "";
      return fail(res, "Sipariş oluşturulamadı: " + error.message + schemaHint, 500);
    }
    saved = data;
  } else {
    getMemOrders().push(saved);
  }

  const route = buildCourierRoute(body.pickupPointId, body.deliveryPointId);

  return ok(res, {
    orderId: saved.id,
    quote,
    route,
    checkout: {
      amount: quote.price,
      currency: quote.currency,
      breakdown: quote.breakdown,
    },
  });
});

/** Simule odeme + teslim sifresi */
export const pay = asyncHandler(async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return fail(res, "Sipariş ID gerekli.", 422);

  let order = null;
  const memOrders = getMemOrders();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("courier_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", req.user.id)
      .single();
    if (error || !data) return fail(res, "Sipariş bulunamadı.", 404);
    if (data.payment_status === "paid") return fail(res, "Bu sipariş zaten ödendi.", 409);
    order = data;
  } else {
    order = memOrders.find((o) => o.id === orderId && o.user_id === req.user.id);
    if (!order) return fail(res, "Sipariş bulunamadı.", 404);
    if (order.payment_status === "paid") return fail(res, "Bu siparis zaten odendi.", 409);
  }

  const pickupCode = generateDeliveryCode();
  const deliveryCode = generateDeliveryCode();
  const paidUpdate = buildPaidOrderUpdate(pickupCode, deliveryCode, null);

  const tracking = await createTrackingRecord({
    userId: req.user.id,
    serviceType: "courier",
    referenceId: order.id,
    referenceTable: "courier_orders",
    carrier: order.carrier || "KargoTigo Kurye",
    origin: order.pickup_address,
    destination: order.delivery_address,
    estimatedHours: 8,
  });

  paidUpdate.tracking_number = tracking.trackingNumber;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("courier_orders")
      .update(paidUpdate)
      .eq("id", orderId)
      .select("*")
      .single();
    if (error) return fail(res, "Odeme kaydedilemedi.", 500);
    order = data;
  } else {
    Object.assign(order, paidUpdate);
    const idx = memOrders.findIndex((o) => o.id === orderId);
    if (idx >= 0) memOrders[idx] = order;
  }

  const route = buildCourierRoute(order.pickup_point_id, order.delivery_point_id);

  return ok(res, {
    order,
    pickupCode,
    deliveryCode,
    trackingNumber: tracking.trackingNumber,
    route,
    message: "Ödeme başarılı. Teslim şifresini gönderici ve alıcı ile paylaşın.",
  });
});

/** Teslim sifresi dogrulama (kurye veya alici) */
export const verifyCode = asyncHandler(async (req, res) => {
  const { orderId, code, role } = req.body || {};
  if (!orderId || !code) return fail(res, "Sipariş ID ve şifre gerekli.", 422);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: order } = await supabase.from("courier_orders").select("*").eq("id", orderId).single();
    if (!order) return fail(res, "Sipariş bulunamadı.", 404);
    if (order.payment_status !== "paid") return fail(res, "Odeme yapilmamis.", 402);
    const expected = role === "pickup" ? order.pickup_code : order.delivery_code;
    if (String(expected) !== String(code).trim()) {
      return fail(res, "Şifre hatalı.", 403);
    }

    const newStatus = role === "pickup" ? "picked_up" : role === "delivery" ? "delivered" : order.status;
    if (role === "pickup" || role === "delivery") {
      await supabase.from("courier_orders").update({ status: newStatus }).eq("id", orderId);
    }

    return ok(res, { verified: true, status: newStatus, role });
  }

  return ok(res, { verified: true, status: "delivered", role });
});

export const myOrders = asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("courier_orders")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return ok(res, { orders: data || [] });
  }
  return ok(res, { orders: getMemOrders().filter((o) => o.user_id === req.user.id) });
});

export const trackByNumber = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;
  if (!trackingNumber) return fail(res, "Takip numarası gerekli.", 422);

  if (!isSupabaseConfigured()) return fail(res, "Veritabanı yapılandırılmamış.", 503);
  const supabase = getSupabase();

  const { data: order } = await supabase
    .from("courier_orders")
    .select("*")
    .eq("tracking_number", trackingNumber)
    .maybeSingle();

  if (!order) return fail(res, "Sipariş bulunamadı. Takip numarasını kontrol edin.", 404);

  // Kurye bilgisi (atanmışsa)
  let courierInfo = null;
  if (order.assigned_courier) {
    const { data: courier } = await supabase
      .from("branch_accounts")
      .select("id, branch_name, contact_phone")
      .eq("id", order.assigned_courier)
      .maybeSingle();
    if (courier) {
      courierInfo = {
        name: courier.branch_name,
        phone: courier.contact_phone || null,
      };
    }
  }

  const pickup   = getPointById(order.pickup_point_id);
  const delivery = getPointById(order.delivery_point_id);
  const route    = buildCourierRoute(order.pickup_point_id, order.delivery_point_id);

  return ok(res, {
    order: {
      id: order.id,
      trackingNumber: order.tracking_number,
      status: order.status,
      paidAt: order.paid_at,
      estimatedMinutes: order.distance_km ? Math.ceil(order.distance_km * 3.5 + 20) : 45,
      distanceKm: order.distance_km,
      senderName: order.sender_name,
      recipientName: order.recipient_name,
      pickupAddress: order.pickup_address,
      deliveryAddress: order.delivery_address,
      price: order.price,
      createdAt: order.created_at,
    },
    courier: courierInfo,
    pickup:   pickup   ? { lat: pickup.lat, lng: pickup.lng, name: pickup.name }   : null,
    delivery: delivery ? { lat: delivery.lat, lng: delivery.lng, name: delivery.name } : null,
    route,
  });
});

export const adminAssignCourier = asyncHandler(async (req, res) => {
  const { requireAdminUser } = await import("../services/admin.service.js");
  await requireAdminUser(req.user.id);
  const { orderId, kuryeAccountId } = req.body || {};
  if (!orderId || !kuryeAccountId) return fail(res, "orderId ve kuryeAccountId gerekli.", 422);
  if (!isSupabaseConfigured()) return fail(res, "Veritabanı yapılandırılmamış.", 503);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("courier_orders")
    .update({ assigned_courier: kuryeAccountId, status: "order_received" })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, { order: data });
});
