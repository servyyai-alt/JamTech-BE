import express from "express";
import * as ctrl from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", ctrl.getCategories);
router.use(protect, restrictTo("admin"));
router.post("/", ctrl.createCategory);
router.patch("/:id", ctrl.updateCategory);
router.delete("/:id", ctrl.deleteCategory);

export default router;
