import mongoose from "mongoose";

// Category > Brand > Model > Variant > Repair specific pricing
const repairPriceSchema = new mongoose.Schema(
  {
    deviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    deviceModel: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceModel", required: true },
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

repairPriceSchema.index(
  { deviceModel: 1, deviceVariant: 1, repairService: 1 },
  { unique: true, partialFilterExpression: { deviceVariant: { $exists: true } } }
);

repairPriceSchema.virtual("finalPrice").get(function () {
  return this.discountPrice && this.discountPrice < this.regularPrice ? this.discountPrice : this.regularPrice;
});
repairPriceSchema.set("toJSON", { virtuals: true });

export default mongoose.model("RepairPrice", repairPriceSchema);
