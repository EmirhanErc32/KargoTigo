import { Router } from "express";
import {
  points, limits, quote, checkout, pay, verifyCode, myOrders,
  adminAssignCourier, trackByNumber,
} from "../controllers/courier.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/points", points);
router.get("/limits", limits);
router.post("/quote", quote);
router.post("/checkout", requireAuth, checkout);
router.post("/pay", requireAuth, pay);
router.post("/verify-code", requireAuth, verifyCode);
router.get("/orders", requireAuth, myOrders);
router.post("/admin/assign", requireAuth, adminAssignCourier);
router.get("/track/:trackingNumber", requireAuth, trackByNumber);

export default router;
