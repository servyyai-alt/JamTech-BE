import express from "express";
import * as ctrl from "../controllers/reviewController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/product/:productId", ctrl.getProductReviews);
router.get("/product/:productId/summary", ctrl.getProductReviewSummary);
router.get("/product/:productId/my-review", protect, ctrl.getMyProductReview);
router.post("/product/:productId", protect, ctrl.createReview);
router.delete("/:id", protect, ctrl.deleteReview);

router.get("/", protect, restrictTo("admin"), ctrl.getAllReviews);
router.patch("/:id/moderate", protect, restrictTo("admin"), ctrl.moderateReview);

export default router;
