import mongoose from "mongoose";

// Category/service defaults with optional brand, model, and variant overrides.
const repairPriceSchema = new mongoose.Schema(
  {
    deviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    deviceModel: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceModel" },
    deviceVariant: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceVariant" }, // optional, some repairs are variant-agnostic
    repairService: { type: mongoose.Schema.Types.ObjectId, ref: "RepairService", required: true },
    regularPrice: { type: Number, required: true },
    discountPrice: { type: Number },
    currency: { type: String, default: "EUR" },
    availability: { type: String, enum: ["in_stock", "order_required", "unavailable"], default: "in_stock" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

repairPriceSchema.index({ deviceCategory: 1, brand: 1, deviceModel: 1, deviceVariant: 1, repairService: 1 });

repairPriceSchema.virtual("finalPrice").get(function () {
  return this.discountPrice && this.discountPrice < this.regularPrice ? this.discountPrice : this.regularPrice;
});
repairPriceSchema.set("toJSON", { virtuals: true });

export default mongoose.model("RepairPrice", repairPriceSchema);
