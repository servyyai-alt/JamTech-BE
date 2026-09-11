import express from "express";
import * as ctrl from "../controllers/bookingController.js";
import { protect, restrictTo, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, ctrl.createBooking);
router.get("/track/:bookingNumber", ctrl.trackBooking);

router.use(protect);
router.get("/my-bookings", ctrl.getMyBookings);
router.get("/:id", ctrl.getBooking);

router.use(restrictTo("admin"));
router.get("/", ctrl.getAllBookings);
router.patch("/:id/status", ctrl.updateBookingStatus);
router.post("/:id/notes", ctrl.addInternalNote);

export default router;
