import express from "express";
import * as ctrl from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, restrictTo("admin"));

router.get("/dashboard-stats", ctrl.getDashboardStats);
router.get("/monthly-sales", ctrl.getMonthlySales);
router.get("/popular-brands", ctrl.getPopularBrands);
router.get("/popular-repairs", ctrl.getMostRequestedRepairs);

export default router;
