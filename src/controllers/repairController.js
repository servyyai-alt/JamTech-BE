import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import RepairService from "../models/RepairService.js";
import RepairPrice from "../models/RepairPrice.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import slugify from "slugify";

// Repair services filtered by compatibility (category/brand/model)
export const getRepairServices = catchAsync(async (req, res) => {
  const { category, brand, model } = req.query;
  const filter = { isActive: true };
  if (category) filter.compatibleCategories = category;
  if (brand) filter.compatibleBrands = brand;
  if (model) filter.compatibleModels = model;

  const services = await RepairService.find(filter).sort("sortOrder name");
  res.status(200).json({ success: true, results: services.length, data: services });
});

export const getRepairService = getOne(RepairService);
export const createRepairService = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
  const doc = await RepairService.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateRepairService = updateOne(RepairService);
export const deleteRepairService = deleteOne(RepairService);

// Repair pricing lookup: Category > Brand > Model > Variant > Service
export const getRepairPrice = catchAsync(async (req, res, next) => {
  const { model, variant, service } = req.query;
  if (!model || !service) return next(new AppError("model and service are required query params.", 400));

  const filter = { deviceModel: model, repairService: service, isActive: true };
  if (variant) filter.deviceVariant = variant;

  const price = await RepairPrice.findOne(filter)
    .populate("deviceCategory brand deviceModel deviceVariant repairService");

  if (!price) return next(new AppError("No pricing found for this configuration.", 404));
  res.status(200).json({ success: true, data: price });
});

export const getRepairPrices = getAll(RepairPrice, {
  populate: "deviceCategory brand deviceModel deviceVariant repairService",
});
export const createRepairPrice = createOne(RepairPrice);
export const updateRepairPrice = updateOne(RepairPrice);
export const deleteRepairPrice = deleteOne(RepairPrice);
