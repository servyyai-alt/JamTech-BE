import mongoose from "mongoose";

const REPAIR_STATUSES = [
  "Pending",
  "Confirmed",
  "Device Received",
  "Diagnosis",
  "Repair In Progress",
  "Awaiting Parts",
  "Repair Completed",
  "Ready for Collection",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: REPAIR_STATUSES, required: true },
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true }, // REP-2026-00001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional guest booking
    deviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCategory", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    deviceModel: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceModel", required: true },
    deviceVariant: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceVariant" },
    repairService: { type: mongoose.Schema.Types.ObjectId, ref: "RepairService", required: true },
    repairPrice: { type: mongoose.Schema.Types.ObjectId, ref: "RepairPrice", required: true },
    price: { type: Number, required: true },

    serviceMethod: {
      type: String,
      enum: ["Store Visit", "Pickup & Delivery", "Mail-in Repair", "On-site Repair"],
      required: true,
    },

    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },

    customerDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },

    status: { type: String, enum: REPAIR_STATUSES, default: "Pending" },
    statusHistory: [statusHistorySchema],
    internalNotes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    paymentRequired: { type: Boolean, default: false },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentStatus: { type: String, enum: ["not_required", "pending", "paid", "failed", "refunded"], default: "not_required" },
  },
  { timestamps: true }
);

serviceBookingSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

export const REPAIR_STATUS_LIST = REPAIR_STATUSES;
export default mongoose.model("ServiceBooking", serviceBookingSchema);
