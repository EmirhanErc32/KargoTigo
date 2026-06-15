import { apiFetch } from "./api.js";

export function listWarehouses(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/warehouses${q ? "?" + q : ""}`, { auth: false });
}

export function findNearestWarehouse(body) {
  return apiFetch("/api/warehouses/nearest", { method: "POST", body, auth: false });
}

export function reverseGeocodeWarehouse(lat, lng) {
  return apiFetch(`/api/warehouses/reverse-geocode?lat=${lat}&lng=${lng}`, { auth: false });
}

export function quoteWarehouse(body) {
  return apiFetch("/api/warehouses/quote", { method: "POST", body, auth: false });
}

export function estimateWarehouse(params) {
  return apiFetch("/api/warehouses/estimate", { method: "POST", body: params, auth: false });
}

export function bookWarehouse(params) {
  return apiFetch("/api/warehouses/book", { method: "POST", body: params });
}

export function payWarehouse(bookingId) {
  return apiFetch("/api/warehouses/pay", { method: "POST", body: { bookingId } });
}

export function myWarehouseBookings() {
  return apiFetch("/api/warehouses/bookings");
}
