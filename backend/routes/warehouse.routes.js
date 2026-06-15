import { Router } from "express";
import {
  list,
  detail,
  nearest,
  quote,
  estimate,
  book,
  pay,
  invoice,
  reverseGeocode,
  myBookings,
} from "../controllers/warehouse.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/reverse-geocode", reverseGeocode);
router.get("/", list);
router.get("/bookings", requireAuth, myBookings);
router.post("/nearest", nearest);
router.post("/quote", quote);
router.post("/estimate", estimate);
router.post("/book", requireAuth, book);
router.post("/pay", requireAuth, pay);
router.get("/bookings/:id/invoice", requireAuth, invoice);
router.get("/:id", detail);

export default router;
