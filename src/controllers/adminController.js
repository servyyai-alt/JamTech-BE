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

  // Include pending and paid for dummy dashboard data view
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: { $in: ["paid", "pending"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const repairRevenueAgg = await ServiceBooking.aggregate([
    { $match: { paymentStatus: { $in: ["paid", "pending", "not_required"] } } },
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
    { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } }, // removed strict paymentStatus paid
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
    {
      $project: {
        brandId: "$brand",
        customBrand: "$customDevice.brand"
      }
    },
    {
      $group: {
        _id: { $ifNull: ["$brandId", "$customBrand"] },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brandObj"
      }
    },
    { $unwind: { path: "$brandObj", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$brandObj.name", "$_id"] },
        count: 1
      }
    }
  ]);
  res.status(200).json({ success: true, data });
});

export const getMostRequestedRepairs = catchAsync(async (req, res) => {
  const data = await ServiceBooking.aggregate([
    {
      $project: {
        repairId: "$repairService",
        customIssue: { $cond: [{ $eq: ["$isManualQuote", true] }, "Custom Repair", null] }
      }
    },
    {
      $group: {
        _id: { $ifNull: ["$repairId", "$customIssue"] },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "repairservices",
        localField: "_id",
        foreignField: "_id",
        as: "serviceObj"
      }
    },
    { $unwind: { path: "$serviceObj", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$serviceObj.name", "$_id"] },
        count: 1
      }
    }
  ]);
  res.status(200).json({ success: true, data });
});
