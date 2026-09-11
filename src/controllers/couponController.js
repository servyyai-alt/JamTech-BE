import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Coupon from "../models/Coupon.js";
import { getAll, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getCoupons = getAll(Coupon, { paginate: false });
export const createCoupon = createOne(Coupon);
export const updateCoupon = updateOne(Coupon);
export const deleteCoupon = deleteOne(Coupon);

// Public: validate a coupon code against current cart subtotal
export const validateCoupon = catchAsync(async (req, res, next) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
  if (!coupon) return next(new AppError("Invalid coupon code.", 404));
  if (coupon.validUntil < new Date()) return next(new AppError("This coupon has expired.", 400));
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return next(new AppError("Coupon usage limit reached.", 400));
  if (subtotal < coupon.minOrderAmount) return next(new AppError(`Minimum order amount is ${coupon.minOrderAmount}.`, 400));

  let discount = coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);

  res.status(200).json({ success: true, data: { code: coupon.code, discount, discountType: coupon.discountType } });
});
