import { Router } from "express";
import { catalog, quote } from "../controllers/heavy.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/catalog", catalog);
router.post("/quote", optionalAuth, quote);

export default router;
