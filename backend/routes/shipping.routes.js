import { Router } from "express";
import { quote, cities } from "../controllers/shipping.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/cities", cities);
router.post("/quote", optionalAuth, quote);

export default router;
