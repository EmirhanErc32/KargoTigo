import bcrypt from "bcryptjs";
import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";
import { ISTANBUL_WAREHOUSES } from "../data/istanbul-warehouses.js";
import { listWarehouses, getWarehouse } from "./warehouse.service.js";

const SALT = 10;

export async function requireAdminUser(userId) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const { data } = await supabase.from("users").select("id, email, role, full_name").eq("id", userId).single();
  if (!data || (data.role !== "admin" && data.email !== "admin@kargotigo.com")) {
    throw Object.assign(new Error("Admin yetkisi gerekli."), { status: 403 });
  }
  return data;
}

export async function deleteUserAccount(adminId, targetUserId) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();

  const { data: target } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!target) throw Object.assign(new Error("Kullanıcı bulunamadı."), { status: 404 });
  if (target.role === "admin" || target.email === "admin@kargotigo.com") {
    throw Object.assign(new Error("Admin hesabı silinemez."), { status: 403 });
  }
  if (target.id === adminId) {
    throw Object.assign(new Error("Kendi hesabınızı silemezsiniz."), { status: 403 });
  }

  // FK'ler "on delete cascade" oldugu icin bagli kayitlar (sube, analiz, siparis vb.) otomatik silinir
  const { error } = await supabase.from("users").delete().eq("id", targetUserId);
  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  return { deleted: true, id: targetUserId };
}

export async function requireBranchUser(userId) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const { data: user } = await supabase.from("users").select("id, email, role, full_name").eq("id", userId).single();
  if (!user || user.role !== "branch") {
    throw Object.assign(new Error("Şube yetkisi gerekli."), { status: 403 });
  }
  const { data: account } = await supabase
    .from("branch_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (!account) throw Object.assign(new Error("Şube hesabı bulunamadı."), { status: 404 });
  return { user, account };
}

export async function getDashboardStats() {
  if (!isSupabaseConfigured()) {
    return {
      users: 0, analyses: 0, courierOrders: 0, warehouseBookings: 0, queries: 0,
      aiToday: 0, paidWarehouses: 0, activeCouriers: 0, branches: 0,
    };
  }
  const supabase = getSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tüm sorguları paralel çalıştır
  const [
    usersRes, analysesRes, courierRes, warehouseRes, queryLogRes, branchRes,
    aiTodayRes, paidWhRes, activeCourierRes,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("analyses").select("*", { count: "exact", head: true }),
    supabase.from("courier_orders").select("*", { count: "exact", head: true }),
    supabase.from("warehouse_bookings").select("*", { count: "exact", head: true }),
    supabase.from("api_query_log").select("*", { count: "exact", head: true }),
    supabase.from("branch_accounts").select("*", { count: "exact", head: true }),
    supabase.from("api_query_log").select("*", { count: "exact", head: true })
      .eq("endpoint", "ai-analyze").gte("created_at", today.toISOString()),
    supabase.from("warehouse_bookings").select("*", { count: "exact", head: true })
      .eq("payment_status", "paid"),
    supabase.from("courier_orders").select("*", { count: "exact", head: true })
      .eq("payment_status", "paid"),
  ]);

  return {
    users:             usersRes.count    || 0,
    analyses:          analysesRes.count || 0,
    courierOrders:     courierRes.count  || 0,
    warehouseBookings: warehouseRes.count || 0,
    queries:           queryLogRes.count || 0,
    branches:          branchRes.count   || 0,
    aiToday:           aiTodayRes.count  || 0,
    paidWarehouses:    paidWhRes.count   || 0,
    activeCouriers:    activeCourierRes.count || 0,
  };
}

export async function listAllActivity() {
  if (!isSupabaseConfigured()) {
    return { users: [], analyses: [], courierOrders: [], warehouseBookings: [], queries: [] };
  }
  const supabase = getSupabase();
  const [users, analyses, courierOrders, warehouseBookings, queries] = await Promise.all([
    supabase.from("users").select("id, email, full_name, role, is_premium, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("analyses").select("id, user_id, product_name, brand, weight_kg, created_at, users(full_name, email)").order("created_at", { ascending: false }).limit(100),
    supabase.from("courier_orders").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("warehouse_bookings").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("api_query_log").select("id, user_id, endpoint, created_at, users(full_name, email)").order("created_at", { ascending: false }).limit(100),
  ]);
  return {
    users: users.data || [],
    analyses: (analyses.data || []).map((a) => ({
      ...a,
      user_name: a.users?.full_name || a.users?.email || null,
    })),
    courierOrders: courierOrders.data || [],
    warehouseBookings: warehouseBookings.data || [],
    queries: (queries.data || []).map((q) => ({
      ...q,
      user_name: q.users?.full_name || q.users?.email || null,
    })),
  };
}

export async function listWarehousesAdmin() {
  const seed = await listWarehouses({});
  const dbRows = await listDbWarehouses();
  const byId = new Map();
  for (const w of seed) byId.set(String(w.id), { ...w });
  for (const w of dbRows) byId.set(String(w.id), { ...w, fromDb: true });
  const warehouses = [...byId.values()];
  if (!isSupabaseConfigured()) {
    return warehouses.map((w) => ({
      ...w,
      productCount: 0,
      staffCount: 0,
      staff: [],
    }));
  }
  const supabase = getSupabase();
  const [{ data: bookings }, { data: staff }] = await Promise.all([
    supabase.from("warehouse_bookings").select("*").eq("payment_status", "paid"),
    supabase.from("branch_accounts").select("id, username, branch_name, warehouse_id, active, created_at").eq("branch_type", "warehouse"),
  ]);

  const bookingsByWh = {};
  for (const b of bookings || []) {
    const wid = b.warehouse_id || b.warehouse_name;
    if (!bookingsByWh[wid]) bookingsByWh[wid] = [];
    bookingsByWh[wid].push(b);
  }

  const staffByWh = {};
  for (const s of staff || []) {
    if (!s.warehouse_id) continue;
    if (!staffByWh[s.warehouse_id]) staffByWh[s.warehouse_id] = [];
    staffByWh[s.warehouse_id].push(s);
  }

  return warehouses.map((w) => ({
    ...w,
    productCount: (bookingsByWh[w.id] || []).length,
    staffCount: (staffByWh[w.id] || []).length,
    staff: staffByWh[w.id] || [],
  }));
}

export async function getWarehouseAdminDetail(warehouseId) {
  const warehouses = await listWarehousesAdmin();
  const warehouse = warehouses.find((w) => w.id === warehouseId || String(w.id) === String(warehouseId));
  if (!warehouse) throw Object.assign(new Error("Depo bulunamadı."), { status: 404 });

  if (!isSupabaseConfigured()) {
    return { warehouse, products: [], staff: [] };
  }
  const supabase = getSupabase();
  const [{ data: products }, { data: staff }] = await Promise.all([
    supabase
      .from("warehouse_bookings")
      .select("*")
      .eq("payment_status", "paid")
      .eq("warehouse_id", warehouseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("branch_accounts")
      .select("id, username, branch_name, warehouse_id, active, user_id, created_at")
      .eq("branch_type", "warehouse")
      .eq("warehouse_id", warehouseId),
  ]);

  return {
    warehouse,
    products: products || [],
    staff: staff || [],
  };
}

export async function logAdminLogin(userId, email) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabase();
    await supabase.from("admin_login_log").insert({ user_id: userId, email: String(email || "").toLowerCase() });
  } catch {
    /* tablo yoksa sessiz */
  }
}

export async function listAdminLogins(limit = 8) {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("admin_login_log")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export async function getOverviewAnalytics() {
  if (!isSupabaseConfigured()) {
    return { weeklyAi: [], weeklyCourier: [], weeklyWarehouse: [] };
  }
  const supabase = getSupabase();
  const days = 7;

  // Tüm gün aralıklarını hesapla
  const ranges = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return {
      label: d.toLocaleDateString("tr-TR", { weekday: "short" }),
      from: d.toISOString(),
      to:   next.toISOString(),
    };
  });

  // Tüm 21 sorguyu aynı anda paralel çalıştır
  const allQueries = ranges.flatMap(r => [
    supabase.from("api_query_log").select("*", { count: "exact", head: true })
      .eq("endpoint", "ai-analyze").gte("created_at", r.from).lt("created_at", r.to),
    supabase.from("courier_orders").select("*", { count: "exact", head: true })
      .gte("created_at", r.from).lt("created_at", r.to),
    supabase.from("warehouse_bookings").select("*", { count: "exact", head: true })
      .gte("created_at", r.from).lt("created_at", r.to),
  ]);

  const results = await Promise.all(allQueries);

  const labels       = ranges.map(r => r.label);
  const weeklyAi        = [];
  const weeklyCourier   = [];
  const weeklyWarehouse = [];

  for (let i = 0; i < days; i++) {
    weeklyAi.push(results[i * 3]?.count     || 0);
    weeklyCourier.push(results[i * 3 + 1]?.count || 0);
    weeklyWarehouse.push(results[i * 3 + 2]?.count || 0);
  }

  return { labels, weeklyAi, weeklyCourier, weeklyWarehouse };
}

export async function createWarehouseRecord(payload) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const {
    name, city, district, address, lat, lng,
    areaSqm, availableSqm, priceMonthly, type, code,
  } = payload;

  if (!name || !city) throw Object.assign(new Error("Depo adı ve şehir zorunlu."), { status: 422 });

  const whCode = String(code || "").trim().toLowerCase()
    || `depo-${Date.now().toString(36)}`;

  const area = Number(areaSqm) || 500;
  const available = Number(availableSqm) || area;

  const { data, error } = await supabase
    .from("warehouses")
    .insert({
      code: whCode,
      name: String(name).trim(),
      city: String(city).trim(),
      district: district ? String(district).trim() : null,
      address: address ? String(address).trim() : null,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      area_sqm: area,
      available_sqm: available,
      price_monthly: Number(priceMonthly) || 150,
      type: type || "standard",
      features: ["24s Guvenlik", "Kamera"],
      rating: 4.5,
      available: true,
    })
    .select("*")
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return { ...data, id: data.code || data.id };
}

export async function listDbWarehouses() {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase.from("warehouses").select("*").order("created_at", { ascending: false });
  return (data || []).map((w) => ({ ...w, id: w.code || w.id }));
}

export async function assignWarehouseStaff({ email, password, branchName, warehouseId, createdBy }) {
  return createBranchAccount({
    email,
    password,
    branchName: branchName || `Depo Yetkili — ${warehouseId}`,
    branchType: "warehouse",
    warehouseId,
    createdBy,
  });
}

export async function createBranchAccount({ email, password, branchName, branchType, warehouseId, createdBy, contactPhone }) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: existing } = await supabase.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
  if (existing) throw Object.assign(new Error("Bu e-posta zaten kayıtlı."), { status: 409 });

  const hash = await bcrypt.hash(password, SALT);

  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      password_hash: hash,
      full_name: branchName,
      role: "branch",
    })
    .select("id, email, full_name, role, created_at")
    .single();

  if (userErr) throw Object.assign(new Error(userErr.message), { status: 500 });

  const { data: branch, error: branchErr } = await supabase
    .from("branch_accounts")
    .insert({
      user_id: user.id,
      username: normalizedEmail,
      password_hash: hash,
      branch_name: branchName,
      branch_type: branchType || "courier",
      warehouse_id: warehouseId || null,
      contact_phone: contactPhone || null,
      created_by: createdBy,
    })
    .select("id, username, branch_name, branch_type, warehouse_id, active, user_id, created_at")
    .single();

  if (branchErr) {
    await supabase.from("users").delete().eq("id", user.id);
    throw Object.assign(new Error(branchErr.message), { status: 500 });
  }

  return { user, branch };
}

export async function listBranchAccounts() {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase
    .from("branch_accounts")
    .select("id, username, branch_name, branch_type, warehouse_id, active, user_id, created_at")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getBranchShipments(accountId) {
  if (!isSupabaseConfigured()) return { warehouse: [], courier: [], account: null, groups: null };
  const supabase = getSupabase();
  const { data: account } = await supabase.from("branch_accounts").select("*").eq("id", accountId).single();
  if (!account) throw Object.assign(new Error("Hesap bulunamadı."), { status: 404 });

  let warehouse = [];
  let courier = [];
  let groups = null;

  if (account.branch_type === "warehouse") {
    let q = supabase
      .from("warehouse_bookings")
      .select("*")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(200);
    if (account.warehouse_id) q = q.eq("warehouse_id", account.warehouse_id);
    const { data } = await q;
    warehouse = data || [];

    const pendingEntry = warehouse.filter((b) => !b.entry_verified_at);
    const inStorage = warehouse.filter((b) => b.entry_verified_at && !b.exit_verified_at);
    const completed = warehouse.filter((b) => b.exit_verified_at);

    groups = {
      pendingEntry,
      inStorage,
      completed,
      stats: {
        pending: pendingEntry.length,
        inStorage: inStorage.length,
        completed: completed.length,
        total: warehouse.length,
      },
    };
  } else {
    // courier_worker: sadece bu kuryeye atanan siparişleri göster
    const { data: courierData } = await supabase
      .from("courier_orders")
      .select("*")
      .eq("payment_status", "paid")
      .eq("assigned_courier", accountId)
      .order("created_at", { ascending: false })
      .limit(100);
    courier = courierData || [];

    const pendingPickup = courier.filter((o) =>
      !o.status || o.status === "paid" || o.status === "order_received"
    );
    const inTransit = courier.filter((o) => o.status === "picked_up");
    const delivered = courier.filter((o) => o.status === "delivered");

    groups = {
      pendingPickup,
      inTransit,
      delivered,
      stats: {
        pending: pendingPickup.length,
        inTransit: inTransit.length,
        delivered: delivered.length,
        total: courier.length,
      },
    };
  }

  let depot = null;
  if (account.branch_type === "warehouse" && account.warehouse_id) {
    const wh = await getWarehouse(account.warehouse_id);
    if (wh) {
      depot = {
        id: wh.id || account.warehouse_id,
        name: wh.name,
        city: wh.city,
        district: wh.district,
        address: wh.address,
        type: wh.type,
        areaSqm: wh.area_sqm,
      };
    } else {
      depot = { id: account.warehouse_id, name: account.warehouse_id };
    }
  }

  return { warehouse, courier, account, groups, depot };
}

export async function verifyBranchCode({ accountId, referenceId, code, action }) {
  if (!isSupabaseConfigured()) throw Object.assign(new Error("Veritabanı yapılandırılmamış."), { status: 503 });
  const supabase = getSupabase();
  const { data: account } = await supabase.from("branch_accounts").select("branch_type").eq("id", accountId).single();
  if (!account) throw Object.assign(new Error("Hesap bulunamadı."), { status: 404 });

  if (account.branch_type === "warehouse") {
    const { data: booking } = await supabase.from("warehouse_bookings").select("*").eq("id", referenceId).single();
    if (!booking) throw Object.assign(new Error("Kayıt bulunamadı."), { status: 404 });
    const expected = action === "entry" ? booking.entry_password : booking.exit_password;
    if (!expected) throw Object.assign(new Error("Bu kayıt için şifre tanımlı değil."), { status: 400 });
    if (String(expected).trim() !== String(code).trim()) {
      throw Object.assign(new Error("Şifre hatalı."), { status: 403 });
    }
    const now = new Date().toISOString();
    // Sadece timestamp alanlarını güncelle; status kolonu opsiyonel
    const patch = action === "entry"
      ? { entry_verified_at: now }
      : { exit_verified_at: now };
    const { error: updateErr } = await supabase.from("warehouse_bookings").update(patch).eq("id", referenceId);
    if (updateErr) throw Object.assign(new Error("Güncelleme başarısız: " + updateErr.message), { status: 500 });
    return { verified: true, action, newStatus: action === "entry" ? "in_storage" : "completed" };
  }

  const { data: order } = await supabase.from("courier_orders").select("*").eq("id", referenceId).single();
  if (!order) throw Object.assign(new Error("Sipariş bulunamadı."), { status: 404 });
  const expected = action === "pickup" ? order.pickup_code : order.delivery_code;
  if (String(expected) !== String(code).trim()) {
    throw Object.assign(new Error("Şifre hatalı."), { status: 403 });
  }
  const status = action === "pickup" ? "picked_up" : "delivered";
  await supabase.from("courier_orders").update({ status }).eq("id", referenceId);
  return { verified: true, action, status, order };
}
