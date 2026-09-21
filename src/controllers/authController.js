import crypto from "crypto";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import { sendTokenResponse } from "../utils/generateToken.js";

export const register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError("An account with this email already exists.", 400));

  const user = await User.create({ name, email, phone, password });
  sendTokenResponse(user, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError("Please provide email and password.", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }
  if (!user.isActive) return next(new AppError("Your account has been deactivated.", 403));

  sendTokenResponse(user, 200, res);
});

export const logout = catchAsync(async (req, res) => {
  res.cookie("token", "loggedout", { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: user });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  // Current password check removed as requested

  user.password = newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("No account found with that email.", 404));

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // In production: email the resetToken via a reset link. Here we return it for dev/testing.
  res.status(200).json({
    success: true,
    message: "Password reset token generated. In production this is emailed to the user.",
    resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired.", 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Address management
export const addAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
});

export const updateAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(new AppError("Address not found.", 404));

  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await user.save();
  res.status(200).json({ success: true, data: user.addresses });
});

export const deleteAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses.pull(req.params.addressId);
  await user.save();
  res.status(200).json({ success: true, data: user.addresses });
});

// Wishlist
export const toggleWishlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;
  const idx = user.wishlist.findIndex((id) => id.toString() === productId);
  if (idx > -1) user.wishlist.splice(idx, 1);
  else user.wishlist.push(productId);
  await user.save();
  res.status(200).json({ success: true, data: user.wishlist });
});
