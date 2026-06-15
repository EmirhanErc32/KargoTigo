import { env } from "../../config/env.js";
import { quoteInternal } from "./internal.provider.js";

/**
 * KARGO ADAPTORU
 * ---------------------------------------------------------------
 * Tek bir quote() fonksiyonu sunar. Hangi saglayicinin kullanilacagi
 * .env'deki SHIPPING_PROVIDER'a gore secilir:
 *   - "internal" -> yerlesik hesaplama motoru (varsayilan)
 *   - "external" -> SHIPPING_API_URL'deki gercek kargo API'si
 *
 * Gercek bir API entegre etmek istediginizde quoteExternal()
 * icindeki istek/donusum kismini doldurmaniz yeterli; uygulamanin
 * geri kalani degismeden calisir (modulerlik).
 */
export async function quoteShipping(params) {
  const provider = env.shipping.provider;

  if (provider === "external" && env.shipping.apiUrl && env.shipping.apiKey) {
    try {
      return await quoteExternal(params);
    } catch (err) {
      // Gercek API hata verirse yerlesik motora dus (kesintisizlik)
      console.warn("[shipping] Harici API hatasi, yerlesik motora geciliyor:", err.message);
      return { provider: "internal-fallback", ...quoteInternal(params) };
    }
  }

  return { provider: "internal", ...quoteInternal(params) };
}

/**
 * Gercek kargo saglayicisi entegrasyonu icin sablon.
 * Saglayicinizin dokumantasyonuna gore istek govdesini ve
 * donen cevabin "options" formatina donusumunu duzenleyin.
 */
async function quoteExternal(params) {
  const resp = await fetch(env.shipping.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.shipping.apiKey}`,
    },
    body: JSON.stringify({
      weight_kg: params.weightKg,
      dimensions_cm: {
        length: params.lengthCm,
        width: params.widthCm,
        height: params.heightCm,
      },
      origin: params.origin,
      destination: params.destination,
    }),
  });

  if (!resp.ok) {
    throw new Error("Harici kargo API yaniti: " + resp.status);
  }

  const data = await resp.json();

  // TODO: Saglayicinin cevabini bizim "options" semasina donustur.
  // Asagidaki ornek bir esleme iskeletidir:
  const options = (data.rates || data.quotes || []).map((r) => ({
    carrierId: r.carrier_code || r.carrier_name,
    carrier: r.carrier_name || r.service_name || "Kargo",
    color: "#5b8cff",
    vehicle: r.service_type || "kamyon",
    vehicleLabel: r.service_name || "Kargo",
    feasible: true,
    reasons: [],
    chargeableDesi: r.billable_weight ?? params.weightKg,
    estimatedDays: r.transit_days ?? null,
    currency: r.currency || "TRY",
    price: r.total_price ?? r.amount,
    breakdown: r.breakdown || {},
  }));

  // En ucuz uygun secenek basta gelsin
  options.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

  return {
    distanceKm: data.distance_km ?? null,
    distanceEstimated: false,
    international: Boolean(params.international),
    chargeableDesi: options[0]?.chargeableDesi ?? params.weightKg,
    options,
  };
}
