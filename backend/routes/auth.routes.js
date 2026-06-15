import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me, quota, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Brute-force'a karsi giris/kayit denemelerini sinirla
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla deneme. Lütfen sonra tekrar deneyin." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);
router.get("/quota", requireAuth, quota);
router.patch("/profile", requireAuth, updateProfile);

export default router;
