import { Router } from "express";
import { analyze, confirmAnalysis } from "../controllers/analyze.controller.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { queryQuota } from "../middleware/quota.middleware.js";

const router = Router();

router.post("/", optionalAuth, queryQuota("ai-analyze"), uploadImage, analyze);

// Onay: giris zorunlu (kullaniciya ait kaydi gunceller).
router.patch("/:id/confirm", requireAuth, confirmAnalysis);

export default router;
