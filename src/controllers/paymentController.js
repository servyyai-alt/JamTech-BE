import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";
import Stripe from "stripe";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123');

// POST /api/payments/session
// Creates a Stripe Checkout session for an existing order or booking.
export const createSession = catchAsync(async (req, res, next) => {
  const { referenceType, referenceId } = req.body;

  let record, amount, currency, name;
  if (referenceType === "order") {
    record = await Order.findById(referenceId);
    if (!record) return next(new AppError("Order not found.", 404));
    amount = record.totalAmount;
    currency = record.currency || "EUR";
    name = `Order ${record.orderNumber}`;
  } else if (referenceType === "booking") {
    record = await ServiceBooking.findById(referenceId).populate("repairService").populate("brand").populate("deviceModel");
    if (!record) return next(new AppError("Booking not found.", 404));
    amount = record.price;
    currency = "EUR";
    name = `Booking ${record.bookingNumber} - ${record.repairService?.name || "Repair"}`;
  } else {
    return next(new AppError("referenceType must be 'order' or 'booking'.", 400));
  }

  const merchantReference = `${referenceType}-${record._id}-${crypto.randomBytes(4).toString("hex")}`;

  const payment = await Payment.create({
    referenceType,
    order: referenceType === "order" ? record._id : undefined,
    booking: referenceType === "booking" ? record._id : undefined,
    user: req.user ? req.user.id : undefined,
    merchantReference,
    amount,
    currency,
    status: "created",
  });

  try {
    const successUrl = `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&ref=${merchantReference}`;
    const cancelUrl = `${process.env.CLIENT_URL}/payment-failed?session_id={CHECKOUT_SESSION_ID}&ref=${merchantReference}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: req.user?.email || record.customerDetails?.email || record.guestEmail,
      client_reference_id: merchantReference,
      metadata: {
        paymentId: payment._id.toString(),
        referenceType,
        orderId: referenceType === "order" ? record._id.toString() : "",
        bookingId: referenceType === "booking" ? record._id.toString() : "",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      adaptive_pricing: {
        enabled: false,
      },
    });

    payment.stripeSessionId = session.id;
    payment.status = "pending";
    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
        paymentId: payment._id,
        merchantReference,
        amount,
        currency,
      },
    });
  } catch (err) {
    payment.status = "error";
    await payment.save();
    return next(new AppError(`Failed to create payment session: ${err.message}`, 502));
  }
});

// GET /api/payments/status/:merchantReference
export const getPaymentStatus = catchAsync(async (req, res, next) => {
  const payment = await Payment.findOne({ merchantReference: req.params.merchantReference });
  if (!payment) return next(new AppError("Payment not found.", 404));
  res.status(200).json({ success: true, data: payment });
});

// POST /api/webhooks/stripe
export const stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const paymentId = session.metadata.paymentId;
    
    if (paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment) {
        payment.rawWebhookEvents.push({ eventCode: event.type, success: event.type !== "checkout.session.async_payment_failed" ? "true" : "false" });
        payment.pspReference = session.payment_intent;
        
        if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
          payment.status = "paid";
        } else if (event.type === "checkout.session.async_payment_succeeded") {
          payment.status = "paid";
        } else if (event.type === "checkout.session.async_payment_failed") {
          payment.status = "failed";
        }
        
        await payment.save();

        if (payment.status === "paid") {
          if (payment.referenceType === "order" && payment.order) {
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: "paid", payment: payment._id, status: "Confirmed" });
          }
          if (payment.referenceType === "booking" && payment.booking) {
            await ServiceBooking.findByIdAndUpdate(payment.booking, { paymentStatus: "paid", payment: payment._id, status: "Confirmed" });
          }
        } else if (payment.status === "failed") {
          if (payment.referenceType === "order" && payment.order) {
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: "failed" });
          }
          if (payment.referenceType === "booking" && payment.booking) {
            await ServiceBooking.findByIdAndUpdate(payment.booking, { paymentStatus: "failed" });
          }
        }
      }
    }
  }

  res.status(200).json({ received: true });
});

// ---- Admin ----
export const getAllPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find().sort("-createdAt");
  res.status(200).json({ success: true, results: payments.length, data: payments });
});
