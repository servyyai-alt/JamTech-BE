import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import DeviceCategory from "../models/DeviceCategory.js";
import Brand from "../models/Brand.js";
import DeviceModel from "../models/DeviceModel.js";
import DeviceVariant from "../models/DeviceVariant.js";
import catchAsync from "../utils/catchAsync.js";
import slugify from "slugify";
import { localizeDocs } from "../utils/localize.js";

// ---- Device Categories ----
export const getCategories = getAll(DeviceCategory, { 
  paginate: false,
  baseFilter: (req) => (req.query.active !== "false" ? { isActive: true } : {}) 
});
export const getCategory = getOne(DeviceCategory);
export const createCategory = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
  const doc = await DeviceCategory.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateCategory = updateOne(DeviceCategory);
export const deleteCategory = deleteOne(DeviceCategory);

// ---- Brands ----
export const getBrands = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.deviceCategory = req.query.category;
  if (req.query.active !== "false") filter.isActive = true;
  const brands = await Brand.find(filter).populate("deviceCategory", "name").sort("sortOrder name");
  localizeDocs(brands, req.query.lang);
  res.status(200).json({ success: true, results: brands.length, data: brands });
});
export const getBrand = getOne(Brand, { populate: "deviceCategory" });
export const createBrand = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
  const doc = await Brand.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateBrand = updateOne(Brand);
export const deleteBrand = deleteOne(Brand);

// ---- Device Models ----
export const getModels = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.category) filter.deviceCategory = req.query.category;
  if (req.query.active !== "false") filter.isActive = true;
  const models = await DeviceModel.find(filter).populate("brand deviceCategory").sort("sortOrder name");
  localizeDocs(models, req.query.lang);
  res.status(200).json({ success: true, results: models.length, data: models });
});
export const getModel = getOne(DeviceModel, { populate: "brand deviceCategory" });
export const createModel = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
  const doc = await DeviceModel.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateModel = updateOne(DeviceModel);
export const deleteModel = deleteOne(DeviceModel);

// ---- Device Variants ----
export const getVariants = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.active !== "false") filter.isActive = true;
  if (req.query.model) filter.deviceModel = req.query.model;
  const variants = await DeviceVariant.find(filter).populate({ path: "deviceModel", populate: { path: "brand" } });
  localizeDocs(variants, req.query.lang);
  res.status(200).json({ success: true, results: variants.length, data: variants });
});
export const getVariant = getOne(DeviceVariant);
export const createVariant = createOne(DeviceVariant);
export const updateVariant = updateOne(DeviceVariant);
export const deleteVariant = deleteOne(DeviceVariant);
