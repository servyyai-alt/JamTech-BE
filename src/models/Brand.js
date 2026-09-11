import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String, default: "" },
    deviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory", required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.index({ name: 1, deviceCategory: 1 }, { unique: true });

export default mongoose.model("Brand", brandSchema);
