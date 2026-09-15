import mongoose from "mongoose";

const deviceVariantSchema = new mongoose.Schema(
  {
    deviceModel: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceModel", required: true },
    label: { type: String, required: true }, // e.g. "256GB - Natural Titanium" or "16GB RAM / 512GB SSD / i7"
    // Flexible spec fields covering phones/tablets/computers
    storage: String,
    color: String,
    network: String, // e.g. 5G, 4G, Wi-Fi only
    generation: String,
    regionalVariant: String,
    screenSize: String,
    processor: String,
    ram: String,
    operatingSystem: String,
    connectivity: String, // Wi-Fi / Cellular for tablets
    isActive: { type: Boolean, default: true },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema(
            {
              label: String,
              storage: String,
              color: String,
              network: String,
              generation: String,
              regionalVariant: String,
              screenSize: String,
              processor: String,
              ram: String,
              operatingSystem: String,
              connectivity: String,
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

export default mongoose.model("DeviceVariant", deviceVariantSchema);
