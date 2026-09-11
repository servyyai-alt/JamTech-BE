import ServiceBooking from "../models/ServiceBooking.js";

// Generates sequential booking numbers like REP-2026-00001
export const generateBookingNumber = async () => {
  const year = new Date().getFullYear();
  const count = await ServiceBooking.countDocuments({
    bookingNumber: { $regex: `^REP-${year}-` },
  });
  const next = String(count + 1).padStart(5, "0");
  return `REP-${year}-${next}`;
};
