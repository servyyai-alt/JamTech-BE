import Order from "../models/Order.js";

// Generates sequential order numbers like ORD-2026-00001
export const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments({
    orderNumber: { $regex: `^ORD-${year}-` },
  });
  const next = String(count + 1).padStart(5, "0");
  return `ORD-${year}-${next}`;
};
