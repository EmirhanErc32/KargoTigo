import { apiFetch } from "./api.js";

export function trackShipment(code) {
  return apiFetch(`/api/tracking/${encodeURIComponent(code)}`, { auth: false });
}

export function myTrackings() {
  return apiFetch("/api/tracking/my");
}
