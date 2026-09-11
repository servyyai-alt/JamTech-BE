import express from "express";
import { body } from "express-validator";
import * as authCtrl from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  validate,
  authCtrl.register
);
router.post("/login", authCtrl.login);
router.post("/logout", authCtrl.logout);
router.post("/forgot-password", authCtrl.forgotPassword);
router.patch("/reset-password/:token", authCtrl.resetPassword);

router.use(protect);
router.get("/me", authCtrl.getMe);
router.patch("/update-me", authCtrl.updateMe);
router.patch("/change-password", authCtrl.changePassword);
router.post("/addresses", authCtrl.addAddress);
router.patch("/addresses/:addressId", authCtrl.updateAddress);
router.delete("/addresses/:addressId", authCtrl.deleteAddress);
router.post("/wishlist/:productId", authCtrl.toggleWishlist);

export default router;
