import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import ServiceBooking, { REPAIR_STATUS_LIST } from "../models/ServiceBooking.js";
import RepairPrice from "../models/RepairPrice.js";
import { generateBookingNumber } from "../utils/generateBookingNumber.js";
import APIFeatures from "../utils/apiFeatures.js";

const POPULATE = "deviceCategory brand deviceModel deviceVariant repairService repairPrice";

// Create a booking. Price is ALWAYS resolved server-side from RepairPrice, never trusted from client.
export const createBooking = catchAsync(async (req, res, next) => {
  const {
    deviceCategory,
    brand,
    deviceModel,
    deviceVariant,
    repairService,
    serviceMethod,
    preferredDate,
    preferredTime,
    customerDetails,
  } = req.body;

  if (!deviceCategory || !brand || !deviceModel || !repairService || !serviceMethod || !preferredDate || !preferredTime) {
    return next(new AppError("Missing required booking fields.", 400));
  }

  const priceFilter = { deviceModel, repairService, isActive: true };
  if (deviceVariant) priceFilter.deviceVariant = deviceVariant;
  const repairPrice = await RepairPrice.findOne(priceFilter);
  if (!repairPrice) return next(new AppError("No pricing available for this repair configuration.", 400));

  const finalPrice = repairPrice.discountPrice && repairPrice.discountPrice < repairPrice.regularPrice
    ? repairPrice.discountPrice
    : repairPrice.regularPrice;

  const bookingNumber = await generateBookingNumber();

  const booking = await ServiceBooking.create({
    bookingNumber,
    customer: req.user ? req.user.id : undefined,
    deviceCategory,
    brand,
    deviceModel,
    deviceVariant,
    repairService,
    repairPrice: repairPrice._id,
    price: finalPrice,
    serviceMethod,
    preferredDate,
    preferredTime,
    customerDetails,
    status: "Pending",
    paymentRequired: false, // set true if you require upfront payment
  });

  await booking.populate(POPULATE);
  res.status(201).json({ success: true, data: booking });
});

// Public tracking by booking number (no auth required)
export const trackBooking = catchAsync(async (req, res, next) => {
  const booking = await ServiceBooking.findOne({ bookingNumber: req.params.bookingNumber }).populate(POPULATE);
  if (!booking) return next(new AppError("No booking found with that booking number.", 404));
  res.status(200).json({ success: true, data: booking });
});

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await ServiceBooking.find({ customer: req.user.id }).populate(POPULATE).sort("-createdAt");
  res.status(200).json({ success: true, results: bookings.length, data: bookings });
});

export const getBooking = catchAsync(async (req, res, next) => {
  const booking = await ServiceBooking.findById(req.params.id).populate(POPULATE);
  if (!booking) return next(new AppError("Booking not found.", 404));
  res.status(200).json({ success: true, data: booking });
});

// ---- Admin ----
export const getAllBookings = catchAsync(async (req, res) => {
  const features = new APIFeatures(ServiceBooking.find().populate(POPULATE), req.query)
    .filter()
    .sort()
    .paginate();
  const bookings = await features.query;
  const total = await ServiceBooking.countDocuments();
  res.status(200).json({ success: true, results: bookings.length, total, data: bookings });
});

export const updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  if (!REPAIR_STATUS_LIST.includes(status)) return next(new AppError("Invalid status value.", 400));

  const booking = await ServiceBooking.findById(req.params.id);
  if (!booking) return next(new AppError("Booking not found.", 404));

  booking.status = status;
  if (note) {
    booking.statusHistory[booking.statusHistory.length - 1].note = note;
  }
  await booking.save();

  res.status(200).json({ success: true, data: booking });
});

export const addInternalNote = catchAsync(async (req, res, next) => {
  const booking = await ServiceBooking.findById(req.params.id);
  if (!booking) return next(new AppError("Booking not found.", 404));

  booking.internalNotes.push({ note: req.body.note, addedBy: req.user.id });
  await booking.save();
  res.status(200).json({ success: true, data: booking });
});
