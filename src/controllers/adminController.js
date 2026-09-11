import catchAsync from "../utils/catchAsync.js";
import Order from "../models/Order.js";
import ServiceBooking from "../models/ServiceBooking.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import RepairService from "../models/RepairService.js";

export const getDashboardStats = catchAsync(async (req, res) => {
  const [totalOrders, totalCustomers, totalProducts, pendingRepairs, totalBookings] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments(),
    ServiceBooking.countDocuments({ status: { $nin: ["Delivered", "Cancelled", "Ready for Collection"] } }),
    ServiceBooking.countDocuments(),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const repairRevenueAgg = await ServiceBooking.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$price" } } },
  ]);

  const ecommerceRevenue = revenueAgg[0]?.total || 0;
  const repairRevenue = repairRevenueAgg[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      totalRevenue: ecommerceRevenue + repairRevenue,
      ecommerceRevenue,
      repairRevenue,
      totalOrders,
      totalBookings,
      pendingRepairs,
      totalCustomers,
      totalProducts,
    },
  });
});

export const getMonthlySales = catchAsync(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }, paymentStatus: "paid" } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.status(200).json({ success: true, data });
});

export const getPopularBrands = catchAsync(async (req, res) => {
  const data = await ServiceBooking.aggregate([
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $lookup: { from: "brands", localField: "_id", foreignField: "_id", as: "brand" } },
    { $unwind: "$brand" },
    { $project: { name: "$brand.name", count: 1 } },
  ]);
  res.status(200).json({ success: true, data });
});

export const getMostRequestedRepairs = catchAsync(async (req, res) => {
  const data = await ServiceBooking.aggregate([
    { $group: { _id: "$repairService", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $lookup: { from: "repairservices", localField: "_id", foreignField: "_id", as: "service" } },
    { $unwind: "$service" },
    { $project: { name: "$service.name", count: 1 } },
  ]);
  res.status(200).json({ success: true, data });
});
