import mongoose from "mongoose";

const repairServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Screen Replacement
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },
    estimatedTime: { type: String, default: "" }, // e.g. "45-60 minutes"
    warranty: { type: String, default: "" }, // e.g. "90 days"
    compatibleCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory" }],
    compatibleBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
    compatibleModels: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeviceModel" }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema(
            {
              name: String,
              shortDescription: String,
              fullDescription: String,
              estimatedTime: String,
              warranty: String,
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

export default mongoose.model("RepairService", repairServiceSchema);
