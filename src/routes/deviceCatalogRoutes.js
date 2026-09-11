import express from "express";
import * as ctrl from "../controllers/deviceCatalogController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/categories", ctrl.getCategories);
router.get("/categories/:id", ctrl.getCategory);
router.get("/brands", ctrl.getBrands);
router.get("/brands/:id", ctrl.getBrand);
router.get("/models", ctrl.getModels);
router.get("/models/:id", ctrl.getModel);
router.get("/variants", ctrl.getVariants);
router.get("/variants/:id", ctrl.getVariant);

router.use(protect, restrictTo("admin"));
router.post("/categories", ctrl.createCategory);
router.patch("/categories/:id", ctrl.updateCategory);
router.delete("/categories/:id", ctrl.deleteCategory);
router.post("/brands", ctrl.createBrand);
router.patch("/brands/:id", ctrl.updateBrand);
router.delete("/brands/:id", ctrl.deleteBrand);
router.post("/models", ctrl.createModel);
router.patch("/models/:id", ctrl.updateModel);
router.delete("/models/:id", ctrl.deleteModel);
router.post("/variants", ctrl.createVariant);
router.patch("/variants/:id", ctrl.updateVariant);
router.delete("/variants/:id", ctrl.deleteVariant);

export default router;
