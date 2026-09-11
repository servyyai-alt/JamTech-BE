import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    label: { type: String, required: true }, // e.g. "Black / 128GB"
    color: String,
    storage: String,
    size: String,
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    discountPrice: Number,
    stock: { type: Number, default: 0 },
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("ProductVariant", productVariantSchema);
