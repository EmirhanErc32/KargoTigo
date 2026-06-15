import { Router } from "express";
import { all, warehouses, queries, courier } from "../controllers/history.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, all);
router.get("/warehouses", requireAuth, warehouses);
router.get("/queries", requireAuth, queries);
router.get("/courier", requireAuth, courier);

export default router;
