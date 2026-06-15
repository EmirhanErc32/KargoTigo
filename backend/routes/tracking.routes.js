import { Router } from "express";
import { track, myTrackings } from "../controllers/tracking.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/my", requireAuth, myTrackings);
router.get("/:code", optionalAuth, track);

export default router;
