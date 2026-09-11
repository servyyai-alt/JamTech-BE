import express from "express";
import * as ctrl from "../controllers/repairController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/services", ctrl.getRepairServices);
router.get("/services/:id", ctrl.getRepairService);
router.get("/prices", ctrl.getRepairPrices);
router.get("/prices/lookup", ctrl.getRepairPrice);

router.use(protect, restrictTo("admin"));
router.post("/services", ctrl.createRepairService);
router.patch("/services/:id", ctrl.updateRepairService);
router.delete("/services/:id", ctrl.deleteRepairService);
router.post("/prices", ctrl.createRepairPrice);
router.patch("/prices/:id", ctrl.updateRepairPrice);
router.delete("/prices/:id", ctrl.deleteRepairPrice);

export default router;
