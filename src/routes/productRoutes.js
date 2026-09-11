import express from "express";
import * as ctrl from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", ctrl.getProducts);
router.get("/search", ctrl.searchProducts);
router.get("/slug/:slug", ctrl.getProductBySlug);
router.get("/:id", ctrl.getProduct);

router.use(protect, restrictTo("admin"));
router.post("/", ctrl.createProduct);
router.patch("/:id", ctrl.updateProduct);
router.delete("/:id", ctrl.deleteProduct);
router.post("/:productId/variants", ctrl.addProductVariant);
router.patch("/variants/:id", ctrl.updateProductVariant);
router.delete("/variants/:id", ctrl.deleteProductVariant);

export default router;
