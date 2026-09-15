import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    specifications: [{ key: String, value: String }],

    regularPrice: { type: Number, required: true },
    salePrice: { type: Number },
    currency: { type: String, default: "EUR" },

    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true },

    hasVariants: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    warranty: { type: String, default: "" },
    returnsPolicy: { type: String, default: "" },
    deliveryEstimate: { type: String, default: "" },

    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    seo: {
      metaTitle: String,
      metaDescription: String,
    },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema(
            {
              title: String,
              brand: String,
              shortDescription: String,
              description: String,
              warranty: String,
              returnsPolicy: String,
              deliveryEstimate: String,
              tags: [String],
            },
            { _id: false }
          ),
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", brand: "text", tags: "text" });

productSchema.virtual("finalPrice").get(function () {
  return this.salePrice && this.salePrice < this.regularPrice ? this.salePrice : this.regularPrice;
});
productSchema.virtual("discountPercent").get(function () {
  if (this.salePrice && this.salePrice < this.regularPrice) {
    return Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
  }
  return 0;
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
