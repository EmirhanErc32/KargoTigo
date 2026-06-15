import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";

function randomCode(len = 6) {
  return String(Math.floor(Math.random() * 10 ** len)).padStart(len, "0");
}

function calcPrice({ movingType, roomSize, originFloor, destFloor, packingService, distanceKm }) {
  const base = movingType === "ofis" ? 14000 : 12500;
  const roomMap = { "1+1": 0, "2+1": 5000, "3+1": 10000, "4+1+": 20000 };
  const floorMap = {
    "giris": 0, "1-4-asansorlu": 1000, "1-4-asansorsuz": 4000,
    "5-asansorlu": 3000, "5-asansorsuz": 8000,
  };
  const packMap = { "yok": 0, "buyuk": 4000, "tam": 8000 };

  const room = roomMap[roomSize] ?? 5000;
  const orig = floorMap[originFloor] ?? 2000;
  const dest = floorMap[destFloor] ?? 2000;
  const pack = packMap[packingService] ?? 2000;

  // Mesafe bedeli: ilk 20 km ücretsiz, sonra km başına 100 TL
  const km = parseFloat(distanceKm) || 0;
  const distCharge = km > 20 ? Math.round((km - 20) * 100) : 0;

  const raw = base + room + orig + dest + pack + distCharge;
  return Math.min(55000, Math.max(12500, raw));
}

export async function createMovingOrder({
  userId, movingType, roomSize, originFloor, destFloor, packingService,
  originAddress, destAddress, contactName, contactPhone, distanceKm,
}) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();

  const price = calcPrice({ movingType, roomSize, originFloor, destFloor, packingService, distanceKm });

  const { data, error } = await supabase
    .from("moving_orders")
    .insert({
      user_id: userId,
      moving_type: movingType,
      room_size: roomSize,
      origin_floor: originFloor,
      dest_floor: destFloor,
      packing_service: packingService,
      origin_address: originAddress,
      dest_address: destAddress,
      contact_name: contactName,
      contact_phone: contactPhone,
      distance_km: distanceKm ? parseFloat(distanceKm) : null,
      price,
      status: "pending_payment",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return { order: data, price, distanceKm: data.distance_km };
}

export async function payMovingOrder(orderId, userId) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("moving_orders").select("*").eq("id", orderId).single();
  if (!existing) throw Object.assign(new Error("Sipariş bulunamadı."), { status: 404 });
  if (String(existing.user_id) !== String(userId))
    throw Object.assign(new Error("Yetkisiz."), { status: 403 });

  const confirmCode = randomCode(6);
  const { data, error } = await supabase
    .from("moving_orders")
    .update({
      status: "paid",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      confirm_code: confirmCode,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return { order: data, confirmCode };
}

export async function getUserMovingOrders(userId) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase
    .from("moving_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function listAllMovingOrders({ status } = {}) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  let q = supabase.from("moving_orders").select("*, branch_accounts(branch_name)").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data || [];
}

export async function assignMovingOrder(orderId, nakliyeciAccountId) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("moving_orders")
    .update({ assigned_to: nakliyeciAccountId, assigned_at: new Date().toISOString(), status: "assigned" })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}

export async function getMovingOrdersForNakliyeci(accountId) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase
    .from("moving_orders")
    .select("*")
    .eq("assigned_to", accountId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function verifyMovingCode({ accountId, orderId, code }) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();

  const { data: order } = await supabase.from("moving_orders").select("*").eq("id", orderId).single();
  if (!order) throw Object.assign(new Error("Sipariş bulunamadı."), { status: 404 });
  if (String(order.assigned_to) !== String(accountId))
    throw Object.assign(new Error("Bu sipariş size atanmamış."), { status: 403 });
  if (String(order.confirm_code) !== String(code).trim())
    throw Object.assign(new Error("Şifre hatalı."), { status: 403 });

  const { data } = await supabase
    .from("moving_orders")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();
  return { verified: true, order: data };
}
