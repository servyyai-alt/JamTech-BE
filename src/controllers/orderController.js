import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import APIFeatures from "../utils/apiFeatures.js";

// Calculates order totals purely from database values. Never trusts amounts sent by the client.
export const calculateOrderTotals = async ({ items, couponCode }) => {
  let subtotal = 0;
  let currency = "";
  const resolvedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) throw new Error(`Product not available: ${item.productId}`);

    if (!currency) currency = product.currency || "EUR";

    let unitPrice = product.salePrice && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;
    let variantDoc = null;

    if (item.variantId) {
      variantDoc = await ProductVariant.findById(item.variantId);
      if (!variantDoc || variantDoc.product.toString() !== product._id.toString()) {
        throw new Error("Invalid product variant.");
      }
      unitPrice = variantDoc.discountPrice && variantDoc.discountPrice < variantDoc.price ? variantDoc.discountPrice : variantDoc.price;
      if (variantDoc.stock < item.quantity) throw new Error(`Insufficient stock for ${product.title} (${variantDoc.label})`);
    } else if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    resolvedItems.push({
      product: product._id,
      productVariant: variantDoc ? variantDoc._id : undefined,
      title: product.title,
      image: product.images?.[0] || variantDoc?.images?.[0] || "",
      variantLabel: variantDoc ? variantDoc.label : undefined,
      quantity: item.quantity,
      price: unitPrice,
    });
  }

  const settings = (await Settings.findOne()) || {};
  let discountAmount = 0;
  let couponDoc = null;

  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!couponDoc) throw new Error("Invalid coupon code.");
    if (couponDoc.validUntil < new Date()) throw new Error("Coupon has expired.");
    if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) throw new Error("Coupon usage limit reached.");
    if (subtotal < couponDoc.minOrderAmount) throw new Error(`Minimum order amount for this coupon is ${couponDoc.minOrderAmount}.`);

    discountAmount = couponDoc.discountType === "percentage"
      ? (subtotal * couponDoc.discountValue) / 100
      : couponDoc.discountValue;
    if (couponDoc.maxDiscountAmount) discountAmount = Math.min(discountAmount, couponDoc.maxDiscountAmount);
  }

  const taxableAmount = subtotal - discountAmount;
  const taxRate = settings.taxRate ?? 21;
  const taxAmount = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;

  const shippingCost = subtotal >= (settings.freeShippingThreshold ?? 50) ? 0 : (settings.standardShippingCost ?? 4.99);

  const totalAmount = Math.round((taxableAmount + taxAmount + shippingCost) * 100) / 100;

  return { resolvedItems, subtotal, discountAmount, taxAmount, shippingCost, totalAmount, currency: currency || "EUR", couponDoc };
};

export const createOrder = catchAsync(async (req, res, next) => {
  const { items, billingAddress, shippingAddress, shippingMethod, couponCode, guestEmail } = req.body;
  if (!items || !items.length) return next(new AppError("Order must contain at least one item.", 400));

  let totals;
  try {
    totals = await calculateOrderTotals({ items, couponCode });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }

  const orderNumber = await generateOrderNumber();

    const order = await Order.create({
    orderNumber,
    customer: req.user ? req.user.id : undefined,
    guestEmail: req.user ? undefined : guestEmail,
    items: totals.resolvedItems,
    billingAddress,
    shippingAddress,
    shippingMethod,
    coupon: totals.couponDoc?._id,
    couponCode: totals.couponDoc?.code,
    discountAmount: totals.discountAmount,
    subtotal: totals.subtotal,
    shippingCost: totals.shippingCost,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    currency: totals.currency,
    status: "Pending",
    paymentStatus: "pending",
  });

  res.status(201).json({ success: true, data: order });
});

export const getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ customer: req.user.id }).sort("-createdAt");
  res.status(200).json({ success: true, results: orders.length, data: orders });
});

export const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  if (!order) return next(new AppError("Order not found.", 404));
  if (req.user.role !== "admin" && order.customer?.toString() !== req.user.id) {
    return next(new AppError("You do not have access to this order.", 403));
  }
  res.status(200).json({ success: true, data: order });
});

export const trackOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) return next(new AppError("No order found with that order number.", 404));
  res.status(200).json({ success: true, data: order });
});

// ---- Admin ----
export const getAllOrders = catchAsync(async (req, res) => {
  const features = new APIFeatures(Order.find(), req.query).filter().sort().paginate();
  const orders = await features.query;
  const total = await Order.countDocuments();
  res.status(200).json({ success: true, results: orders.length, total, data: orders });
});

export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError("Order not found.", 404));
  order.status = req.body.status;
  await order.save();
  res.status(200).json({ success: true, data: order });
});
