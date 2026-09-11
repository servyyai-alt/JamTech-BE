import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";
import { createPaymentSession, submitAdditionalDetails, validateHmacSignature } from "../services/adyenService.js";
import crypto from "crypto";

// POST /api/payments/session
// Creates an Adyen Checkout session for an existing order or booking.
// The amount is ALWAYS read from the database record, never from the request body.
export const createSession = catchAsync(async (req, res, next) => {
  const { referenceType, referenceId } = req.body; // "order" | "booking"

  let record, amount, currency;
  if (referenceType === "order") {
    record = await Order.findById(referenceId);
    if (!record) return next(new AppError("Order not found.", 404));
    amount = record.totalAmount;
    currency = record.currency;
  } else if (referenceType === "booking") {
    record = await ServiceBooking.findById(referenceId);
    if (!record) return next(new AppError("Booking not found.", 404));
    amount = record.price;
    currency = "EUR";
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
    const session = await createPaymentSession({
      amount,
      currency,
      merchantReference,
      returnUrl: `${process.env.CLIENT_URL}/payment-result?ref=${merchantReference}`,
      shopperEmail: req.user?.email || record.customerDetails?.email || record.guestEmail,
      shopperReference: req.user?.id,
    });

    res.status(200).json({
      success: true,
      data: {
        sessionData: session.sessionData,
        sessionId: session.id,
        clientKey: process.env.ADYEN_CLIENT_KEY, // safe to expose - public key
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

// POST /api/payments/details — used for additional payment actions (3DS, redirects, etc.)
export const paymentDetails = catchAsync(async (req, res, next) => {
  try {
    const result = await submitAdditionalDetails(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(new AppError(`Failed to submit payment details: ${err.message}`, 502));
  }
});

// GET /api/payments/status/:merchantReference — frontend polls this after redirect
export const getPaymentStatus = catchAsync(async (req, res, next) => {
  const payment = await Payment.findOne({ merchantReference: req.params.merchantReference });
  if (!payment) return next(new AppError("Payment not found.", 404));
  res.status(200).json({ success: true, data: payment });
});

// POST /api/webhooks/adyen
// CRITICAL: verifies HMAC signature before trusting any notification, and
// this is the SOLE source of truth for finalizing payment/order/booking status.
export const adyenWebhook = catchAsync(async (req, res) => {
  const notificationItems = req.body?.notificationItems || [];

  for (const wrapper of notificationItems) {
    const item = wrapper.NotificationRequestItem;
    if (!item) continue;

    const isValid = validateHmacSignature(item);
    if (!isValid) {
      console.warn("Rejected Adyen webhook: invalid HMAC signature", item.merchantReference);
      continue; // skip untrusted notifications, but still ack with [accepted] below
    }

    const payment = await Payment.findOne({ merchantReference: item.merchantReference });
    if (!payment) continue;

    payment.pspReference = item.pspReference;
    payment.rawWebhookEvents.push({ eventCode: item.eventCode, success: item.success });

    if (item.eventCode === "AUTHORISATION") {
      payment.status = item.success === "true" ? "authorised" : "failed";
      payment.adyenResultCode = item.success === "true" ? "Authorised" : "Refused";
    } else if (item.eventCode === "CAPTURE") {
      payment.status = item.success === "true" ? "paid" : "failed";
    } else if (item.eventCode === "REFUND") {
      payment.status = "refunded";
    } else if (item.eventCode === "CANCELLATION") {
      payment.status = "cancelled";
    }
    await payment.save();

    // Sync order/booking payment status
    if (payment.status === "paid" || payment.status === "authorised") {
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

  // Adyen requires this exact response to acknowledge receipt
  res.status(200).send("[accepted]");
});

// ---- Admin ----
export const getAllPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find().sort("-createdAt");
  res.status(200).json({ success: true, results: payments.length, data: payments });
});
