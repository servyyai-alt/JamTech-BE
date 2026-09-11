import express from "express";
import * as ctrl from "../controllers/orderController.js";
import { protect, restrictTo, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, ctrl.createOrder);
router.get("/track/:orderNumber", ctrl.trackOrder);

router.use(protect);
router.get("/my-orders", ctrl.getMyOrders);
router.get("/:id", ctrl.getOrder);

router.use(restrictTo("admin"));
router.get("/", ctrl.getAllOrders);
router.patch("/:id/status", ctrl.updateOrderStatus);

export default router;
