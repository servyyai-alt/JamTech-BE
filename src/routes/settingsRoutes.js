import express from "express";
import * as ctrl from "../controllers/settingsController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", ctrl.getSettings);
router.patch("/", protect, restrictTo("admin"), ctrl.updateSettings);

export default router;
