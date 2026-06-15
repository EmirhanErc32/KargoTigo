import crypto from "node:crypto";

/** Benzersiz takip numarasi: KG + 10 karakter */
export function generateTrackingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `KG${code}`;
}
