import { Router } from "express";
import { countries, docs, quote, createShipment } from "../controllers/international.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/countries", countries);
router.get("/docs/:code", docs);
router.post("/quote", optionalAuth, quote);
router.post("/shipment", requireAuth, createShipment);

export default router;
