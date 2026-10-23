import express from "express";
import * as ctrl from "../controllers/gradeController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", ctrl.getGrades);
router.use(protect, restrictTo("admin"));
router.post("/", ctrl.createGrade);
router.patch("/:id", ctrl.updateGrade);
router.delete("/:id", ctrl.deleteGrade);

export default router;
