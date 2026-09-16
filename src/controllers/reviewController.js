import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
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
  const filter = { product: req.params.productId, isApproved: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate("user", "name avatar").sort("-createdAt").skip(skip).limit(limit),
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
