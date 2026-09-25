import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import RepairService from "../models/RepairService.js";
import RepairPrice from "../models/RepairPrice.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import slugify from "slugify";
import { findBestRepairPrice } from "../services/repairPricing.js";
import { localizeDocs } from "../utils/localize.js";

// Services can be configured at four levels — device variant, model, brand, and
// device category. A service is available for the selected device only when
// it isn't excluded by any configured constraint: if compatibleModels is
// non-empty the model must be in it, likewise for variants, brands and categories.
export const getRepairServices = catchAsync(async (req, res) => {
  const { category, brand, model, variant } = req.query;

  const filter = {};
  if (req.query.active !== "false") filter.isActive = true;
  if (model) filter.$and = (filter.$and || []).concat([{ $or: [{ compatibleModels: { $size: 0 } }, { compatibleModels: model }] }]);
  if (brand) filter.$and = (filter.$and || []).concat([{ $or: [{ compatibleBrands: { $size: 0 } }, { compatibleBrands: brand }] }]);
  if (category) filter.$and = (filter.$and || []).concat([{ $or: [{ compatibleCategories: { $size: 0 } }, { compatibleCategories: category }] }]);
  if (variant) filter.$and = (filter.$and || []).concat([{ $or: [{ compatibleVariants: { $size: 0 } }, { compatibleVariants: variant }] }]);

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
