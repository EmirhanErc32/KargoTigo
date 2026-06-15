import { apiFetch } from "./api.js";

export function loadCountries() {
  return apiFetch("/api/international/countries", { auth: false });
}

export function loadCountryDocs(code) {
  return apiFetch(`/api/international/docs/${code}`, { auth: false });
}

export function quoteInternational(params) {
  return apiFetch("/api/international/quote", { method: "POST", body: params, auth: false });
}

export function createInternationalShipment(params) {
  return apiFetch("/api/international/shipment", { method: "POST", body: params });
}
