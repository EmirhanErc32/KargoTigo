import { Router } from "express";
import {
  postMovingOrder, postPayMoving, getMyMoving,
  adminListMoving, adminAssignMoving,
  nakliyeciOrders, nakliyeciVerify,
} from "../controllers/moving.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireBranchAuth } from "../middleware/admin.middleware.js";

const router = Router();

// Müşteri
router.post("/", requireAuth, postMovingOrder);
router.post("/pay", requireAuth, postPayMoving);
router.get("/my", requireAuth, getMyMoving);

// Admin
router.get("/admin/list", requireAuth, adminListMoving);
router.post("/admin/assign", requireAuth, adminAssignMoving);

// Nakliyeci paneli
router.get("/nakliyeci/orders", requireAuth, requireBranchAuth, nakliyeciOrders);
router.post("/nakliyeci/verify", requireAuth, requireBranchAuth, nakliyeciVerify);

export default router;
