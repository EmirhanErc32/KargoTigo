import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { listUserBookings } from "./warehouse.service.js";

const ENDPOINT_LABELS = {
  "ai-analyze": "AI Urun Analizi",
  "shipping-quote": "Kargo Fiyat Sorgusu",
  "heavy-quote": "Agir Yuk Teklifi",
};

export async function getWarehouseHistory(userId) {
  const bookings = await listUserBookings(userId);
  return bookings.map((b) => {
    const paid = b.payment_status === "paid";
    return {
      id: b.id,
      type: "warehouse",
      title: b.warehouse_name || b.warehouses?.name || "Depo Kiralama",
      subtitle: [b.district || b.warehouse_district || b.warehouses?.district, b.city || b.warehouse_city || b.warehouses?.city]
        .filter(Boolean)
        .join(", "),
      amount: b.total_price,
      currency: b.currency || "TRY",
      status: paid ? "Odendi" : b.status === "confirmed" ? "Onaylandi" : "Bekliyor",
      paymentStatus: b.payment_status,
      invoiceNo: b.invoice_no,
      storageDays: b.storage_days,
      areaSqm: b.area_sqm,
      weightKg: b.weight_kg,
      lengthCm: b.length_cm,
      widthCm: b.width_cm,
      heightCm: b.height_cm,
      userAddress: b.user_address,
      personalAddress: b.personal_address,
      contactPhone: b.contact_phone,
      firstName: b.first_name,
      lastName: b.last_name,
      email: b.email,
      notes: b.notes,
      storageSubtotal: b.storage_subtotal,
      kdv: b.kdv,
      subtotal: b.subtotal,
      entryPassword: paid ? b.entry_password : null,
      exitPassword: paid ? b.exit_password : null,
      paidAt: b.paid_at,
      createdAt: b.created_at,
    };
  });
}

export async function getQueryHistory(userId) {
  const items = [];

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();

    const { data: analyses } = await supabase
      .from("analyses")
      .select("id, product_name, brand, model, weight_kg, confidence, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    (analyses || []).forEach((a) => {
      items.push({
        id: a.id,
        type: "analysis",
        title: a.product_name || "Urun Analizi",
        subtitle: [a.brand, a.model].filter(Boolean).join(" ") || "AI gorsel analiz",
        meta: a.weight_kg ? `${a.weight_kg} kg` : null,
        confidence: a.confidence,
        createdAt: a.created_at,
      });
    });

    const { data: logs } = await supabase
      .from("api_query_log")
      .select("id, endpoint, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    (logs || []).forEach((l) => {
      items.push({
        id: l.id,
        type: "query",
        title: ENDPOINT_LABELS[l.endpoint] || l.endpoint,
        subtitle: "Gunluk sorgu kaydi",
        createdAt: l.created_at,
      });
    });

    const { data: shipments } = await supabase
      .from("shipments")
      .select("id, origin, destination, carrier, price, currency, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    (shipments || []).forEach((s) => {
      items.push({
        id: s.id,
        type: "shipping",
        title: `${s.origin || "?"} → ${s.destination || "?"}`,
        subtitle: s.carrier || "Kargo fiyat karsilastirma",
        amount: s.price,
        currency: s.currency || "TRY",
        createdAt: s.created_at,
      });
    });
  }

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40);
}

export async function getCourierHistory(userId) {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  const { data } = await supabase
    .from("courier_orders")
    .select("id, pickup_address, delivery_address, sender_name, sender_phone, sender_tc, recipient_name, recipient_phone, recipient_tc, weight_kg, length_cm, width_cm, height_cm, package_description, price, tracking_number, pickup_code, delivery_code, payment_status, status, created_at, paid_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data || []).map((o) => ({
    id: o.id,
    type: "courier",
    title: o.tracking_number || "Kurye Gönderisi",
    subtitle: `${o.sender_name || "?"} → ${o.recipient_name || "?"}`,
    route: `${shortAddr(o.pickup_address)} → ${shortAddr(o.delivery_address)}`,
    amount: o.price,
    currency: "TRY",
    status: o.payment_status === "paid" ? (o.status === "delivered" ? "Teslim edildi" : o.status === "picked_up" ? "Alındı" : "Ödendi") : "Bekliyor",
    trackingNumber: o.tracking_number,
    senderName: o.sender_name,
    senderPhone: o.sender_phone,
    senderTc: o.sender_tc,
    recipientName: o.recipient_name,
    recipientPhone: o.recipient_phone,
    recipientTc: o.recipient_tc,
    weightKg: o.weight_kg,
    lengthCm: o.length_cm,
    widthCm: o.width_cm,
    heightCm: o.height_cm,
    packageDescription: o.package_description,
    pickupCode: o.payment_status === "paid" ? o.pickup_code : null,
    deliveryCode: o.payment_status === "paid" ? o.delivery_code : null,
    createdAt: o.created_at,
    paidAt: o.paid_at,
  }));
}

export async function getFullHistory(userId) {
  const [warehouses, queries, courier, moving] = await Promise.all([
    getWarehouseHistory(userId),
    getQueryHistory(userId),
    getCourierHistory(userId),
    getMovingHistory(userId),
  ]);
  return { warehouses, queries, courier, moving };
}

export async function getMovingHistory(userId) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase
    .from("moving_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

function shortAddr(s = "") {
  const t = String(s).trim();
  return t.length > 28 ? t.slice(0, 28) + "…" : t;
}
