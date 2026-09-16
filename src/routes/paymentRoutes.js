import express from "express";
import * as ctrl from "../controllers/paymentController.js";
import { protect, restrictTo, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/session", optionalAuth, ctrl.createSession);
router.get("/status/:merchantReference", ctrl.getPaymentStatus);

router.get("/", protect, restrictTo("admin"), ctrl.getAllPayments);

export default router;
