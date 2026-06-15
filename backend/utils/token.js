import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Kullanici icin JWT (access token) uretir.
 * payload icine hassas bilgi (sifre vb.) KONULMAZ.
 */
export function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/**
 * Token'i dogrular. Gecersiz/suresi dolmussa hata firlatir.
 */
export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
