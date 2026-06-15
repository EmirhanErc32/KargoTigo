import { apiFetch } from "./api.js";

export function loadCourierPoints() {
  return apiFetch("/api/courier/points", { auth: false });
}

export function loadCourierLimits() {
  return apiFetch("/api/courier/limits", { auth: false });
}

export function quoteCourier(params) {
  return apiFetch("/api/courier/quote", { method: "POST", body: params, auth: false });
}

export function checkoutCourier(params) {
  return apiFetch("/api/courier/checkout", { method: "POST", body: params });
}

export function payCourier(orderId) {
  return apiFetch("/api/courier/pay", { method: "POST", body: { orderId } });
}

export function verifyDeliveryCode(orderId, code, role) {
  return apiFetch("/api/courier/verify-code", { method: "POST", body: { orderId, code, role } });
}

export function myCourierOrders() {
  return apiFetch("/api/courier/orders");
}
