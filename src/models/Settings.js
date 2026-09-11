import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "JAM Smart Tech" },
    tagline: { type: String, default: "Smart Repair. Smart Solutions." },
    logo: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
    },
    currency: { type: String, default: "EUR" },
    taxRate: { type: Number, default: 21 }, // VAT %
    freeShippingThreshold: { type: Number, default: 50 },
    standardShippingCost: { type: Number, default: 4.99 },
    enabledServiceMethods: {
      type: [String],
      default: ["Store Visit", "Pickup & Delivery", "Mail-in Repair", "On-site Repair"],
    },
    enabledGamingDevices: {
      type: [String],
      default: [
        "PlayStation 5",
        "PlayStation 5 Slim",
        "PlayStation 4",
        "Xbox Series X",
        "Xbox Series S",
        "Xbox One",
        "Nintendo Switch",
        "Nintendo Switch OLED",
        "Nintendo Switch Lite",
      ],
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
