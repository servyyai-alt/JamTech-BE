import express from "express";
import { stripeWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Stripe webhook — must accept raw/standard JSON, no auth (verified via signature instead)
router.post("/stripe", stripeWebhook);

export default router;
