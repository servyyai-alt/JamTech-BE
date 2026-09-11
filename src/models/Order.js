import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productVariant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    title: String,
    image: String,
    variantLabel: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // unit price at time of order
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // ORD-2026-00001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestEmail: String,

    items: [orderItemSchema],

    billingAddress: addressSnapshotSchema,
    shippingAddress: addressSnapshotSchema,
    shippingMethod: { type: String, default: "Standard" },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // ALWAYS recalculated server-side, never trust frontend total

    currency: { type: String, default: "EUR" },

    status: { type: String, enum: ORDER_STATUSES, default: "Pending" },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },

    notes: String,
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

export const ORDER_STATUS_LIST = ORDER_STATUSES;
export default mongoose.model("Order", orderSchema);
