import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import RepairService from "../models/RepairService.js";
import RepairPrice from "../models/RepairPrice.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import slugify from "slugify";
import { findBestRepairPrice } from "../services/repairPricing.js";
import { localizeDocs } from "../utils/localize.js";

// Services are configured by category. Model-specific compatibility is no
// longer required for a device to receive the category's standard repairs.
export const getRepairServices = catchAsync(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category) {
    filter.$or = [
      { compatibleCategories: category },
      { compatibleCategories: { $size: 0 } },
    ];
  }

  const services = await RepairService.find(filter).sort("sortOrder name");
  localizeDocs(services, req.query.lang);
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

// Pricing lookup: category default, then optional brand/model/variant override.
export const getRepairPrice = catchAsync(async (req, res, next) => {
  const { category, brand, model, variant, service } = req.query;
  if (!category || !service) return next(new AppError("category and service are required query params.", 400));

  const price = await findBestRepairPrice({ category, brand, model, variant, service });

  // A repair can still be requested when no fixed price is configured.
  // This avoids hiding services from customers and routes them to a manual quote.
  if (!price) return res.status(200).json({ success: true, data: { isQuoteOnly: true } });
  await price.populate("deviceCategory brand deviceModel deviceVariant repairService");
  localizeDocs(price, req.query.lang);
  res.status(200).json({ success: true, data: price });
});

export const getRepairPrices = getAll(RepairPrice, {
  populate: "deviceCategory brand deviceModel deviceVariant repairService",
});
export const createRepairPrice = createOne(RepairPrice);
export const updateRepairPrice = updateOne(RepairPrice);
export const deleteRepairPrice = deleteOne(RepairPrice);
