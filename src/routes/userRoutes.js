import express from "express";
import * as ctrl from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, restrictTo("admin"));

router.get("/", ctrl.getAllUsers);
router.get("/:id", ctrl.getUser);
router.patch("/:id/status", ctrl.updateUserStatus);
router.patch("/:id/role", ctrl.updateUserRole);

export default router;
