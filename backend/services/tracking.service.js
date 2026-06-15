import { generateTrackingNumber } from "../utils/trackingNumber.js";
import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";

const STATUS_FLOW = [
  { key: "order_received", label: "Sipariş Alındı", icon: "📋" },
  { key: "picked_up", label: "Kurye Teslim Aldi", icon: "📦" },
  { key: "in_transit", label: "Yolda", icon: "🚚" },
  { key: "out_for_delivery", label: "Dagitimda", icon: "🏃" },
  { key: "delivered", label: "Teslim Edildi", icon: "✅" },
];

const COURIER_FLOW = [
  { key: "order_received", label: "Sipariş Alındı", icon: "📋" },
  { key: "courier_assigned", label: "Kurye Atandi", icon: "🏍️" },
  { key: "picked_up", label: "Paket Alindi", icon: "📦" },
  { key: "in_transit", label: "Yolda", icon: "🚀" },
  { key: "delivered", label: "Teslim Edildi", icon: "✅" },
];

const mem = { events: new Map(), items: new Map() };

export function getStatusFlows(serviceType) {
  return serviceType === "courier" ? COURIER_FLOW : STATUS_FLOW;
}

/**
 * Yeni takip kaydi olusturur ve simule edilmis olaylari uretir.
 */
export async function createTrackingRecord({
  userId,
  serviceType,
  referenceId,
  referenceTable,
  carrier,
  origin,
  destination,
  estimatedHours = 48,
}) {
  const trackingNumber = generateTrackingNumber();
  const flow = getStatusFlows(serviceType);
  const now = Date.now();
  const events = flow.map((step, i) => {
    const offsetHours = (estimatedHours / flow.length) * i;
    return {
      status: step.key,
      label: step.label,
      icon: step.icon,
      location: i === 0 ? origin : i === flow.length - 1 ? destination : transitLocation(origin, destination, i, flow.length),
      description: stepDescription(step.key, carrier),
      event_at: new Date(now - (flow.length - 1 - i) * 3600000 * 2).toISOString(),
      visible: i <= computeVisibleIndex(estimatedHours, i, flow.length),
    };
  });

  const item = {
    tracking_number: trackingNumber,
    user_id: userId,
    service_type: serviceType,
    reference_id: referenceId,
    reference_table: referenceTable,
    carrier,
    origin,
    destination,
    status: events.filter((e) => e.visible).at(-1)?.status || "order_received",
    events,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("tracking_events").insert(
      events
        .filter((e) => e.visible)
        .map((e) => ({
          tracking_number: trackingNumber,
          service_type: serviceType,
          reference_id: referenceId,
          user_id: userId,
          status: e.status,
          label: e.label,
          location: e.location,
          description: e.description,
          event_at: e.event_at,
        }))
    );
    if (error) console.warn("[tracking] DB insert:", error.message);
  }

  mem.items.set(trackingNumber, item);
  mem.events.set(trackingNumber, events);
  return { trackingNumber, events: events.filter((e) => e.visible) };
}

export async function lookupTracking(trackingNumber, userId = null) {
  const code = String(trackingNumber || "").trim().toUpperCase();
  if (!code) return null;

  if (mem.items.has(code)) {
    const item = mem.items.get(code);
    if (userId && item.user_id && item.user_id !== userId) return null;
    return formatTrackingResult(item);
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();

    const { data: courier } = await supabase
      .from("courier_orders")
      .select("*")
      .eq("tracking_number", code)
      .maybeSingle();

    if (courier) {
      if (userId && courier.user_id !== userId) return null;
      return await buildFromCourier(courier);
    }

    const { data: shipment } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_number", code)
      .maybeSingle();

    if (shipment) {
      if (userId && shipment.user_id !== userId) return null;
      return await buildFromShipment(shipment);
    }

    const { data: events } = await supabase
      .from("tracking_events")
      .select("*")
      .eq("tracking_number", code)
      .order("event_at", { ascending: true });

    if (events?.length) {
      return formatFromDbEvents(code, events);
    }
  }

  return null;
}

export async function listUserTrackings(userId) {
  const results = [];

  for (const item of mem.items.values()) {
    if (item.user_id === userId) results.push(formatTrackingResult(item));
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();

    const [{ data: couriers }, { data: shipments }] = await Promise.all([
      supabase
        .from("courier_orders")
        .select("tracking_number, status, carrier, origin_city, destination_city, pickup_address, delivery_address, price, created_at, urgency")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("shipments")
        .select("tracking_number, status, carrier, origin, destination, price, currency, estimated_days, service_type, created_at")
        .eq("user_id", userId)
        .not("tracking_number", "is", null)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    for (const c of couriers || []) {
      if (c.tracking_number && !results.find((r) => r.trackingNumber === c.tracking_number)) {
        const detail = await lookupTracking(c.tracking_number, userId);
        if (detail) results.push(detail);
      }
    }
    for (const s of shipments || []) {
      if (s.tracking_number && !results.find((r) => r.trackingNumber === s.tracking_number)) {
        const detail = await lookupTracking(s.tracking_number, userId);
        if (detail) results.push(detail);
      }
    }
  }

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function buildFromCourier(order) {
  const flow = getStatusFlows("courier");
  const events = await getDbEvents(order.tracking_number) || synthesizeEvents(flow, {
    carrier: order.carrier,
    origin: order.pickup_address || order.origin_city,
    destination: order.delivery_address || order.destination_city,
    status: order.status,
    createdAt: order.created_at,
    hours: order.urgency === "express" ? 2 : order.urgency === "same_day" ? 8 : 24,
  });

  return {
    trackingNumber: order.tracking_number,
    serviceType: "courier",
    serviceLabel: "Şehir İçi Kurye",
    carrier: order.carrier,
    origin: order.pickup_address || order.origin_city,
    destination: order.delivery_address || order.destination_city,
    status: order.status,
    statusLabel: flow.find((f) => f.key === order.status)?.label || order.status,
    price: order.price,
    currency: "TRY",
    events,
    createdAt: order.created_at,
  };
}

async function buildFromShipment(shipment) {
  const serviceType = shipment.service_type || "standard";
  const flow = getStatusFlows(serviceType === "courier" ? "courier" : "standard");
  const events = await getDbEvents(shipment.tracking_number) || synthesizeEvents(flow, {
    carrier: shipment.carrier,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status === "quoted" ? "order_received" : shipment.status,
    createdAt: shipment.created_at,
    hours: (shipment.estimated_days || 2) * 24,
  });

  return {
    trackingNumber: shipment.tracking_number,
    serviceType,
    serviceLabel: serviceType === "heavy" ? "Ağır Yük Kargo" : "Kargo Gönderisi",
    carrier: shipment.carrier,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status,
    statusLabel: flow.find((f) => f.key === shipment.status)?.label || shipment.status,
    price: shipment.price,
    currency: shipment.currency || "TRY",
    events,
    createdAt: shipment.created_at,
  };
}

async function getDbEvents(trackingNumber) {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("tracking_number", trackingNumber)
    .order("event_at", { ascending: true });
  if (!data?.length) return null;
  return data.map((e) => ({
    status: e.status,
    label: e.label,
    icon: flowIcon(e.status),
    location: e.location,
    description: e.description,
    event_at: e.event_at,
    visible: true,
  }));
}

function formatFromDbEvents(trackingNumber, events) {
  return {
    trackingNumber,
    serviceType: events[0]?.service_type || "standard",
    serviceLabel: "Kargo Gönderisi",
    carrier: null,
    origin: events[0]?.location,
    destination: events.at(-1)?.location,
    status: events.at(-1)?.status,
    statusLabel: events.at(-1)?.label,
    events: events.map((e) => ({ ...e, visible: true, icon: flowIcon(e.status) })),
    createdAt: events[0]?.event_at,
  };
}

function formatTrackingResult(item) {
  const flow = getStatusFlows(item.service_type);
  return {
    trackingNumber: item.tracking_number,
    serviceType: item.service_type,
    serviceLabel: item.service_type === "courier"
      ? "Şehir İçi Kurye"
      : item.service_type === "heavy"
        ? "Agir Yuk"
        : "Kargo",
    carrier: item.carrier,
    origin: item.origin,
    destination: item.destination,
    status: item.status,
    statusLabel: flow.find((f) => f.key === item.status)?.label || item.status,
    events: item.events.filter((e) => e.visible),
    createdAt: item.created_at,
  };
}

function synthesizeEvents(flow, { carrier, origin, destination, status, createdAt, hours }) {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const currentIdx = flow.findIndex((f) => f.key === status);
  const visibleIdx = currentIdx >= 0 ? currentIdx : 1;

  return flow.map((step, i) => ({
    status: step.key,
    label: step.label,
    icon: step.icon,
    location: i === 0 ? origin : i === flow.length - 1 ? destination : transitLocation(origin, destination, i, flow.length),
    description: stepDescription(step.key, carrier),
    event_at: new Date(created + (hours * 3600000 * i) / flow.length).toISOString(),
    visible: i <= visibleIdx,
  })).filter((e) => e.visible);
}

function computeVisibleIndex(estimatedHours, index, total) {
  const elapsed = estimatedHours * 0.4;
  const threshold = (estimatedHours / total) * index;
  return elapsed >= threshold ? index : Math.max(0, Math.floor(elapsed / (estimatedHours / total)));
}

function transitLocation(origin, dest, i, total) {
  const hubs = ["Transfer Merkezi", "Dagitim Bolgesi", "Aktarma Noktasi"];
  return hubs[i % hubs.length];
}

function stepDescription(status, carrier) {
  const c = carrier || "KargoTigo";
  const map = {
    order_received: `${c} siparişinizi sisteme kaydetti.`,
    courier_assigned: "En yakın kurye gönderinize atandı.",
    picked_up: "Paketiniz teslim alindi ve isleme alindi.",
    in_transit: "Gönderiniz aktarma noktasından yola çıktı.",
    out_for_delivery: "Gönderiniz dağıtım aracına yüklendi.",
    delivered: "Gönderi başarıyla teslim edildi.",
  };
  return map[status] || "Durum guncellendi.";
}

function flowIcon(status) {
  const all = [...STATUS_FLOW, ...COURIER_FLOW];
  return all.find((f) => f.key === status)?.icon || "📍";
}
