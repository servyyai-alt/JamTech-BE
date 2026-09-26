import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, required: true },
    images: [String],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
// serves the product reviews list: filter by product + approval, newest first
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
// serves the star distribution summary
reviewSchema.index({ product: 1, isApproved: 1, rating: 1 });

export default mongoose.model("Review", reviewSchema);
