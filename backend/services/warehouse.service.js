import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { ISTANBUL_WAREHOUSES } from "../data/istanbul-warehouses.js";
import { buildInvoiceHtml } from "./warehouse-invoice.service.js";

const memBookings = [];
const KDV_RATE = 0.2;
const STACK_HEIGHT_M = 2.4;
const MIN_AREA_SQM = 4;
export const MAX_WEIGHT_KG = 100;
export const MIN_DAILY_STORAGE = 300;

export { ISTANBUL_WAREHOUSES as WAREHOUSE_SEED };

export async function listWarehouses({ city, type } = {}) {
  let list = [...ISTANBUL_WAREHOUSES];
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let q = supabase.from("warehouses").select("*").eq("available", true);
    if (city) q = q.ilike("city", `%${city}%`);
    if (type) q = q.eq("type", type);
    const { data, error } = await q.order("price_monthly", { ascending: true });
    if (!error && data?.length) list = data;
  }
  if (city) list = list.filter((w) => w.city.toLowerCase().includes(city.toLowerCase()));
  if (type) list = list.filter((w) => w.type === type);
  return list;
}

export async function getWarehouse(id) {
  const list = await listWarehouses();
  return list.find((w) => w.id === id || String(w.id) === String(id));
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcRequiredArea({ lengthCm, widthCm, heightCm, weightKg }) {
  const weight = Math.max(0.1, Number(weightKg) || 0);
  if (weight > MAX_WEIGHT_KG) {
    throw Object.assign(
      new Error(`Maksimum ${MAX_WEIGHT_KG} kg kabul edilir.`),
      { status: 422 }
    );
  }

  const l = Math.max(1, Number(lengthCm) || 0);
  const w = Math.max(1, Number(widthCm) || 0);
  const h = Math.max(1, Number(heightCm) || 0);

  const volumeM3 = (l * w * h) / 1_000_000;
  const weightVolume = weight / 280;
  const chargeableM3 = Math.max(volumeM3, weightVolume);
  const footprint = chargeableM3 / STACK_HEIGHT_M;
  return Math.max(MIN_AREA_SQM, Math.ceil(footprint * 1.25 * 10) / 10);
}

/** Konuma gore gunluk taban ucret (min 300 TL) */
function locationDailyBase(warehouse) {
  const tier = Number(warehouse.price_monthly) || 160;
  return Math.max(MIN_DAILY_STORAGE, round(300 + (tier - 125) * 2.2));
}

/** Kargo agirligi ve hacmine gore carpan */
function cargoMultiplier(areaSqm, weightKg) {
  const w = Math.min(MAX_WEIGHT_KG, Math.max(0.1, weightKg));
  const weightMult = 1 + (w / MAX_WEIGHT_KG) * 0.75;
  const areaMult = 1 + Math.max(0, areaSqm - 2) * 0.12;
  return weightMult * areaMult;
}

function calcDailyStorage(warehouse, areaSqm, weightKg) {
  const base = locationDailyBase(warehouse);
  const mult = cargoMultiplier(areaSqm, weightKg);
  return Math.max(MIN_DAILY_STORAGE, round(base * mult));
}

export function calculateFullQuote(warehouse, params) {
  const {
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    storageDays = 30,
    userLat,
    userLng,
  } = params;

  const areaSqm = calcRequiredArea({ lengthCm, widthCm, heightCm, weightKg });
  const days = Math.max(1, Number(storageDays) || 30);
  const dailyStorageTotal = calcDailyStorage(warehouse, areaSqm, weightKg);
  const storageSubtotal = round(dailyStorageTotal * days);
  const dailyRatePerSqm = round(dailyStorageTotal / Math.max(areaSqm, 1));

  const subtotal = storageSubtotal;
  const kdv = round(subtotal * KDV_RATE);
  const total = round(subtotal + kdv);

  const volumeM3 = round(((lengthCm || 0) * (widthCm || 0) * (heightCm || 0)) / 1_000_000);

  return {
    areaSqm,
    volumeM3,
    weightKg: Number(weightKg) || 0,
    storageDays: days,
    dailyRatePerSqm,
    dailyStorageTotal,
    storageSubtotal,
    subtotal,
    kdvRate: KDV_RATE,
    kdv,
    totalPrice: total,
    currency: "TRY",
    pricePerSqm: warehouse.price_monthly,
  };
}

export async function findNearestWarehouse({ lat, lng, type } = {}) {
  if (lat == null || lng == null) {
    throw Object.assign(new Error("Konum bilgisi gerekli."), { status: 422 });
  }
  let list = await listWarehouses({ city: "İstanbul", type });
  list = list.filter((w) => w.lat != null && w.lng != null);
  if (!list.length) throw Object.assign(new Error("Depo bulunamadı."), { status: 404 });

  const ranked = list
    .map((w) => ({
      ...w,
      distanceKm: round(haversineKm(lat, lng, w.lat, w.lng)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    nearest: ranked[0],
    alternatives: ranked.slice(1, 4),
  };
}

export function calculateBookingPrice(warehouse, areaSqm, months) {
  const days = Math.max(1, Number(months) || 1) * 30;
  return calculateFullQuote(warehouse, { areaSqm, storageDays: days, weightKg: 100, lengthCm: 100, widthCm: 80, heightCm: 80 });
}

function genPassword() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function genInvoiceNo() {
  const d = new Date();
  return `EF-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export async function createBooking(payload) {
  const {
    userId,
    warehouseId,
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    storageDays,
    userLat,
    userLng,
    userAddress,
    productPhoto,
    firstName,
    lastName,
    tcNo,
    email,
    phone,
    personalAddress,
    notes,
  } = payload;

  const warehouse = await getWarehouse(warehouseId);
  if (!warehouse) throw Object.assign(new Error("Depo bulunamadı."), { status: 404 });

  const pricing = calculateFullQuote(warehouse, {
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    storageDays,
    userLat,
    userLng,
  });

  if (pricing.areaSqm > warehouse.available_sqm) {
    throw Object.assign(
      new Error(`Bu depoda maksimum ${warehouse.available_sqm} m2 kullanılabilir. Ürün boyutu daha büyük alan gerektiriyor.`),
      { status: 422 }
    );
  }

  const entryPassword = genPassword();
  const exitPassword = genPassword();
  const invoiceNo = genInvoiceNo();

  const booking = {
    id: `bk-${Date.now()}`,
    user_id: userId,
    warehouse_id: warehouseId,
    warehouse_name: warehouse.name,
    city: warehouse.city,
    district: warehouse.district,
    area_sqm: pricing.areaSqm,
    storage_days: pricing.storageDays,
    length_cm: lengthCm,
    width_cm: widthCm,
    height_cm: heightCm,
    weight_kg: weightKg,
    user_lat: userLat,
    user_lng: userLng,
    user_address: userAddress,
    product_photo: productPhoto || null,
    first_name: firstName,
    last_name: lastName,
    tc_no: tcNo,
    email,
    contact_phone: phone,
    personal_address: personalAddress,
    storage_subtotal: pricing.storageSubtotal,
    transport_fee: 0,
    transport_distance_km: null,
    kdv: pricing.kdv,
    subtotal: pricing.subtotal,
    total_price: pricing.totalPrice,
    currency: "TRY",
    entry_password: entryPassword,
    exit_password: exitPassword,
    invoice_no: invoiceNo,
    notes: notes || null,
    payment_status: "pending",
    status: "pending_payment",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("warehouse_bookings")
      .insert({
        user_id: userId,
        warehouse_id: warehouseId,
        warehouse_name: warehouse.name,
        warehouse_city: warehouse.city,
        warehouse_district: warehouse.district,
        area_sqm: pricing.areaSqm,
        months: Math.ceil(pricing.storageDays / 30),
        start_date: new Date().toISOString().slice(0, 10),
        total_price: pricing.totalPrice,
        contact_phone: phone,
        notes,
        status: "pending_payment",
        storage_days: pricing.storageDays,
        length_cm: lengthCm,
        width_cm: widthCm,
        height_cm: heightCm,
        weight_kg: weightKg,
        user_lat: userLat,
        user_lng: userLng,
        user_address: userAddress,
        product_photo: productPhoto,
        first_name: firstName,
        last_name: lastName,
        tc_no: tcNo,
        email,
        personal_address: personalAddress,
        storage_subtotal: pricing.storageSubtotal,
        transport_fee: 0,
        transport_distance_km: null,
        kdv: pricing.kdv,
        subtotal: pricing.subtotal,
        entry_password: entryPassword,
        exit_password: exitPassword,
        invoice_no: invoiceNo,
        payment_status: "pending",
      })
      .select("*")
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    booking.id = data.id;
    Object.assign(booking, mapBookingRow(data));
  }

  memBookings.push(booking);

  return { booking, pricing, warehouse };
}

export async function completePayment(bookingId, userId) {
  const booking = await getBooking(bookingId, userId);
  if (!booking) throw Object.assign(new Error("Rezervasyon bulunamadı."), { status: 404 });
  if (booking.payment_status === "paid") throw Object.assign(new Error("Odeme zaten yapilmis."), { status: 409 });

  booking.payment_status = "paid";
  booking.status = "confirmed";
  booking.paid_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("warehouse_bookings")
      .update({ payment_status: "paid", status: "confirmed", paid_at: booking.paid_at })
      .eq("id", bookingId)
      .eq("user_id", userId);
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
  }

  const memIdx = memBookings.findIndex((b) => String(b.id) === String(bookingId) && b.user_id === userId);
  if (memIdx >= 0) Object.assign(memBookings[memIdx], booking);

  const warehouse = await getWarehouse(booking.warehouse_id);
  const invoiceHtml = buildInvoiceHtml({ booking, warehouse });

  return { booking, warehouse, invoiceHtml };
}

export async function getBooking(bookingId, userId) {
  const local = memBookings.find(
    (b) => String(b.id) === String(bookingId) && b.user_id === userId
  );

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("warehouse_bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return mapBookingRow(data);
    if (error) console.warn("[warehouse] getBooking:", error.message);
    return local || null;
  }

  return local || null;
}

export async function listUserBookings(userId) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("warehouse_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.warn("[warehouse] listUserBookings:", error.message);
    if (data?.length) return data.map(mapBookingRow);
  }
  return memBookings.filter((b) => b.user_id === userId);
}

function mapBookingRow(row) {
  return {
    ...row,
    warehouse_name: row.warehouse_name,
    city: row.warehouse_city || row.city,
    district: row.warehouse_district || row.district,
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
