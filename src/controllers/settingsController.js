import catchAsync from "../utils/catchAsync.js";
import Settings from "../models/Settings.js";

export const getSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.status(200).json({ success: true, data: settings });
});

export const updateSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: settings });
});
