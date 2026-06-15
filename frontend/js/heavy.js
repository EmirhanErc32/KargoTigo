import { apiFetch } from "./api.js";

export function loadHeavyCatalog() {
  return apiFetch("/api/heavy/catalog", { auth: false });
}

export function quoteHeavy(params) {
  return apiFetch("/api/heavy/quote", { method: "POST", body: params });
}
