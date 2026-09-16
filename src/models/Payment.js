import mongoose from "mongoose";

// Stores only non-sensitive payment metadata. Never store card numbers/CVV.
const paymentSchema = new mongoose.Schema(
  {
    referenceType: { type: String, enum: ["order", "booking"], required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceBooking" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    merchantReference: { type: String, required: true, unique: true },
    pspReference: { type: String },

    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },

    paymentMethod: { type: String, default: "" }, // e.g. scheme, ideal, paypal
    status: {
      type: String,
      enum: ["created", "pending", "authorised", "paid", "failed", "cancelled", "refused", "refunded", "error"],
      default: "created",
    },

    stripeSessionId: String,
    rawWebhookEvents: [
      {
        eventCode: String,
        success: String,
        receivedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
