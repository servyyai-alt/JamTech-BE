import mongoose from "mongoose";

const deviceModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. iPhone 16 Pro
    slug: { type: String, required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    deviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory", required: true },
    deviceType: { type: String, default: "" }, // for computers: Laptop / Desktop / All-in-One
    image: { type: String, default: "" },
    releaseYear: Number,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema(
            { name: String, deviceType: String },
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

deviceModelSchema.index({ slug: 1, brand: 1 }, { unique: true });

export default mongoose.model("DeviceModel", deviceModelSchema);
