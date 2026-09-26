import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// whitelist so a query param can never reach Mongo as an arbitrary sort
const REVIEW_SORTS = {
  recent: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const buildReviewFilter = (productId, rating) => {
  const filter = { product: productId, isApproved: true };
  const star = parseInt(rating, 10);
  if (star >= 1 && star <= 5) filter.rating = star;
  return filter;
};

const recalculateProductRating = async (productId) => {
  const productObjectId = new mongoose.Types.ObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { product: productObjectId, isApproved: true } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats[0]?.avgRating || 0,
    numReviews: stats[0]?.count || 0,
  });
};

export const getProductReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const filter = buildReviewFilter(req.params.productId, req.query.rating);
  const sort = REVIEW_SORTS[req.query.sort] || REVIEW_SORTS.recent;

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate("user", "name avatar").sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
    data: reviews,
  });
});

// one round trip for the average, the total and the 5->1 star breakdown that
// the review summary panel needs; kept separate from the list so paging
// through reviews never re-runs it
export const getProductReviewSummary = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return next(new AppError("Invalid product id.", 400));
  }

  const rows = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(req.params.productId), isApproved: true } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let weighted = 0;
  rows.forEach(({ _id, count }) => {
    const star = Number(_id);
    if (star >= 1 && star <= 5) {
      distribution[star] = count;
      total += count;
      weighted += star * count;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      average: total ? Number((weighted / total).toFixed(2)) : 0,
      total,
      distribution,
    },
  });
});

// the signed-in user's own review, so their edit/delete card still renders
// when their review is on page 12 of a long list
export const getMyProductReview = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(200).json({ success: true, data: null });
  }

  const review = await Review.findOne({
    product: req.params.productId,
    user: req.user.id,
  }).populate("user", "name avatar");

  res.status(200).json({ success: true, data: review || null });
});

export const createReview = catchAsync(async (req, res, next) => {
  const existing = await Review.findOne({ product: req.params.productId, user: req.user.id });
  if (existing) return next(new AppError("You have already reviewed this product.", 400));

  const review = await Review.create({
    product: req.params.productId,
    user: req.user.id,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
    images: req.body.images,
  });

  await recalculateProductRating(req.params.productId);
  res.status(201).json({ success: true, data: review });
});

export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError("Review not found.", 404));
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("Not authorized to delete this review.", 403));
  }
  await review.deleteOne();
  await recalculateProductRating(review.product);
  res.status(204).json({ success: true, data: null });
});

// Admin
export const getAllReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find().populate("user", "name email").populate("product", "title").sort("-createdAt");
  res.status(200).json({ success: true, results: reviews.length, data: reviews });
});

export const moderateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved }, { new: true });
  if (!review) return next(new AppError("Review not found.", 404));
  await recalculateProductRating(review.product);
  res.status(200).json({ success: true, data: review });
});
