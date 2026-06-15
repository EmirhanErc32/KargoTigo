import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env, validateEnv } from "./config/env.js";
import { isSupabaseConfigured } from "./config/supabase.js";
import { ok } from "./utils/http.js";

import authRoutes from "./routes/auth.routes.js";
import analyzeRoutes from "./routes/analyze.routes.js";
import shippingRoutes from "./routes/shipping.routes.js";
import courierRoutes from "./routes/courier.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import heavyRoutes from "./routes/heavy.routes.js";
import historyRoutes from "./routes/history.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import movingRoutes from "./routes/moving.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

validateEnv();

const app = express();

// --- Genel middleware ---
app.use(
  cors({
    origin(origin, cb) {
      // Origin yoksa (curl/Postman) veya izinli listede ise kabul et
      if (!origin || env.corsOrigin.includes("*") || env.corsOrigin.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("CORS engellendi: " + origin));
    },
  })
);
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Saglik kontrolu ---
app.get("/api/health", (req, res) =>
  ok(res, {
    status: "up",
    supabase: isSupabaseConfigured(),
    geminiModel: env.gemini.model,
    shippingProvider: env.shipping.provider,
    time: new Date().toISOString(),
  })
);

// --- API route'lari ---
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/courier", courierRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/heavy", heavyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/moving", movingRoutes);

// --- Frontend'i ayni sunucudan servis et (opsiyonel kolaylik) ---
const frontendDir = path.resolve(__dirname, "../frontend");
app.use(
  express.static(frontendDir, {
    setHeaders(res, filePath) {
      if (/\.(html|css|js)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  })
);

// --- Hata yonetimi ---
app.use("/api", notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`\n  KargoTigo backend calisiyor:`);
  console.log(`  -> http://localhost:${env.port}`);
  console.log(`  -> Saglik: http://localhost:${env.port}/api/health`);
  console.log(`  -> Frontend: http://localhost:${env.port}/\n`);
});
