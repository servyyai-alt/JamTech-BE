import express from "express";
import * as ctrl from "../controllers/couponController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", ctrl.validateCoupon);

router.use(protect, restrictTo("admin"));
router.get("/", ctrl.getCoupons);
router.post("/", ctrl.createCoupon);
router.patch("/:id", ctrl.updateCoupon);
router.delete("/:id", ctrl.deleteCoupon);

export default router;
