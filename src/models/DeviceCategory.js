import mongoose from "mongoose";

const deviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Smartphones, Tablets, Computers, Gaming Devices
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("DeviceCategory", deviceCategorySchema);
