import {
  listWarehouses,
  getWarehouse,
  calculateFullQuote,
  findNearestWarehouse,
  createBooking,
  completePayment,
  getBooking,
  listUserBookings,
} from "../services/warehouse.service.js";
import { buildInvoiceHtml } from "../services/warehouse-invoice.service.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const list = asyncHandler(async (req, res) => {
  const { city, type } = req.query;
  const warehouses = await listWarehouses({ city, type });
  return ok(res, { warehouses });
});

export const detail = asyncHandler(async (req, res) => {
  const warehouse = await getWarehouse(req.params.id);
  if (!warehouse) return fail(res, "Depo bulunamadı.", 404);
  return ok(res, { warehouse });
});

export const nearest = asyncHandler(async (req, res) => {
  const { lat, lng, type } = req.body || {};
  if (lat == null || lng == null) return fail(res, "Konum (lat/lng) gerekli.", 422);
  const result = await findNearestWarehouse({ lat: Number(lat), lng: Number(lng), type });
  return ok(res, result);
});

export const quote = asyncHandler(async (req, res) => {
  const {
    warehouseId,
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    storageDays,
    userLat,
    userLng,
  } = req.body || {};

  const warehouse = await getWarehouse(warehouseId);
  if (!warehouse) return fail(res, "Depo bulunamadı.", 404);

  const pricing = calculateFullQuote(warehouse, {
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    storageDays,
    userLat,
    userLng,
  });

  return ok(res, { pricing, warehouse });
});

export const estimate = asyncHandler(async (req, res) => {
  const { warehouseId, areaSqm, months, lengthCm, widthCm, heightCm, weightKg, storageDays, userLat, userLng } = req.body || {};
  const warehouse = await getWarehouse(warehouseId);
  if (!warehouse) return fail(res, "Depo bulunamadı.", 404);

  const pricing = calculateFullQuote(warehouse, {
    lengthCm: lengthCm || 100,
    widthCm: widthCm || 80,
    heightCm: heightCm || 80,
    weightKg: weightKg || 100,
    storageDays: storageDays || (months ? months * 30 : 30),
    userLat,
    userLng,
  });

  return ok(res, { pricing, warehouse });
});

export const book = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.warehouseId) return fail(res, "Depo seçimi gerekli.", 422);
  if (!body.firstName || !body.lastName) return fail(res, "Ad soyad gerekli.", 422);
  if (!body.tcNo || body.tcNo.length !== 11) return fail(res, "Gecerli TC kimlik no girin (11 hane).", 422);
  if (!body.phone) return fail(res, "Telefon gerekli.", 422);
  if (!body.email) return fail(res, "E-posta gerekli.", 422);

  const result = await createBooking({
    userId: req.user.id,
    warehouseId: body.warehouseId,
    lengthCm: body.lengthCm,
    widthCm: body.widthCm,
    heightCm: body.heightCm,
    weightKg: body.weightKg,
    storageDays: body.storageDays,
    userLat: body.userLat,
    userLng: body.userLng,
    userAddress: body.userAddress,
    productPhoto: body.productPhoto,
    firstName: body.firstName,
    lastName: body.lastName,
    tcNo: body.tcNo,
    email: body.email,
    phone: body.phone,
    personalAddress: body.personalAddress,
    notes: body.notes,
  });

  return ok(res, result);
});

export const pay = asyncHandler(async (req, res) => {
  const { bookingId } = req.body || {};
  if (!bookingId) return fail(res, "Rezervasyon ID gerekli.", 422);

  const result = await completePayment(bookingId, req.user.id);
  return ok(res, result);
});

export const invoice = asyncHandler(async (req, res) => {
  const booking = await getBooking(req.params.id, req.user.id);
  if (!booking) return fail(res, "Rezervasyon bulunamadı.", 404);
  if (booking.payment_status !== "paid") return fail(res, "Fatura icin odeme tamamlanmali.", 402);

  const warehouse = await getWarehouse(booking.warehouse_id);
  const html = buildInvoiceHtml({ booking, warehouse });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

export const reverseGeocode = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!lat || !lng) return fail(res, "Konum (lat/lng) gerekli.", 422);

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=tr`;
    const r = await fetch(url);
    const data = await r.json();

    const district =
      data.locality ||
      data.localityInfo?.administrative?.[2]?.name ||
      data.localityInfo?.administrative?.[1]?.name ||
      "";
    const city = data.city || "Istanbul";
    const neighbourhood = data.localityInfo?.informative?.[0]?.name || "";
    const parts = [neighbourhood, district, city].filter((p, i, arr) => p && arr.indexOf(p) === i);
    const address = parts.join(", ") || `${district}, ${city}`;

    return ok(res, { address, district, city });
  } catch {
    return fail(res, "Adres cozulemedi.", 502);
  }
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await listUserBookings(req.user.id);
  return ok(res, { bookings });
});
