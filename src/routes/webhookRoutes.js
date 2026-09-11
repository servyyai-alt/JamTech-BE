import express from "express";
import { adyenWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Adyen webhook — must accept raw/standard JSON, no auth (verified via HMAC instead)
router.post("/adyen", adyenWebhook);

export default router;
