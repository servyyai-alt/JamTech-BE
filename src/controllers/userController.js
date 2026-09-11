import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import APIFeatures from "../utils/apiFeatures.js";

// Admin: manage customers
export const getAllUsers = catchAsync(async (req, res) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search(["name", "email"])
    .sort()
    .paginate();
  const users = await features.query;
  const total = await User.countDocuments();
  res.status(200).json({ success: true, results: users.length, total, data: users });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));
  res.status(200).json({ success: true, data: user });
});

export const updateUserStatus = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!user) return next(new AppError("User not found.", 404));
  res.status(200).json({ success: true, data: user });
});

export const updateUserRole = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) return next(new AppError("User not found.", 404));
  res.status(200).json({ success: true, data: user });
});
