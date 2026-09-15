import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import Category from "../models/Category.js";
import APIFeatures from "../utils/apiFeatures.js";
import { getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import slugify from "slugify";
import { localizeDocs } from "../utils/localize.js";

export const getProducts = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.regularPrice = {};
    if (req.query.minPrice) filter.regularPrice.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.regularPrice.$lte = Number(req.query.maxPrice);
  }
  if (req.query.minRating) filter.rating = { $gte: Number(req.query.minRating) };
  if (req.query.inStock === "true") filter.stock = { $gt: 0 };
  if (req.query.discount === "true") filter.$expr = { $lt: ["$salePrice", "$regularPrice"] };

  let sort = "-createdAt";
  if (req.query.sort === "price_asc") sort = "regularPrice";
  if (req.query.sort === "price_desc") sort = "-regularPrice";
  if (req.query.sort === "newest") sort = "-createdAt";
  if (req.query.sort === "popular") sort = "-numReviews";
  if (req.query.sort === "rating") sort = "-rating";

  const features = new APIFeatures(Product.find(filter).populate("category"), req.query)
    .search(["title", "brand", "tags"]);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    features.query.sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  localizeDocs(products, req.query.lang);
  res.status(200).json({ success: true, results: products.length, total, page, pages: Math.ceil(total / limit), data: products });
});

export const getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category");
  if (!product) return next(new AppError("Product not found.", 404));

  const variants = await ProductVariant.find({ product: product._id, isActive: true });
  const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(4);

  localizeDocs(product, req.query.lang);
  localizeDocs(related, req.query.lang);

  res.status(200).json({ success: true, data: { product, variants, related } });
});

export const getProduct = getOne(Product, { populate: "category" });

export const createProduct = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.title, { lower: true, strict: true });
  const doc = await Product.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateProduct = updateOne(Product);
export const deleteProduct = deleteOne(Product);

// Variants
export const addProductVariant = catchAsync(async (req, res) => {
  const doc = await ProductVariant.create({ ...req.body, product: req.params.productId });
  await Product.findByIdAndUpdate(req.params.productId, { hasVariants: true });
  res.status(201).json({ success: true, data: doc });
});
export const updateProductVariant = updateOne(ProductVariant);
export const deleteProductVariant = deleteOne(ProductVariant);

// Categories
export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort("sortOrder name");
  localizeDocs(categories, req.query.lang);
  res.status(200).json({ success: true, results: categories.length, data: categories });
});
export const createCategory = catchAsync(async (req, res) => {
  if (!req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
  const doc = await Category.create(req.body);
  res.status(201).json({ success: true, data: doc });
});
export const updateCategory = updateOne(Category);
export const deleteCategory = deleteOne(Category);

// Global search (products + hint of other entities is composed in searchController)
export const searchProducts = catchAsync(async (req, res) => {
  const q = req.query.q || "";
  const products = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } }).limit(10);
  res.status(200).json({ success: true, data: products });
});
