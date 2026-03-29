import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import ServiceProvider from "../models/ServiceProvider.js";
import Pet from "../models/Pet.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { USER, PET_OWNER } from "../constants/roles.js";
import { calculatePlatformCommission } from "../utils/commission.js";

const adminAnalyticsService = {
  /**
   * Get platform-wide analytics for admins
   */
  async getPlatformAnalytics() {
    // Get total counts
    const [
      totalUsers,
      totalProviders,
      totalPets,
      totalProducts,
      totalBookings,
      totalOrders,
    ] = await Promise.all([
      User.countDocuments({ roles: { $in: [USER, PET_OWNER] } }),
      ServiceProvider.countDocuments(),
      Pet.countDocuments(),
      Product.countDocuments(),
      Booking.countDocuments(),
      Order.countDocuments(),
    ]);

    const getSettledOrderAmount = (order) => {
      if (order?.payment?.status === "completed") {
        return order.payment.amount || order.totalAmount || 0;
      }

      // COD has no online payment record; treat as settled only when delivered.
      if (order?.paymentMethod === "cod" && order?.status === "delivered") {
        return order.totalAmount || 0;
      }

      return 0;
    };

    // Get booking revenue stats
    const completedBookings = await Booking.find({
      status: "confirmed",
      paymentStatus: "completed",
    }).populate("payment");

    const totalBookingRevenue = completedBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.amount || 0);
    }, 0);

    // Get order revenue stats
    const completedOrders = await Order.find({
      status: { $in: ["confirmed", "processing", "delivered"] },
    }).populate("payment");

    const totalOrderRevenue = completedOrders.reduce((sum, order) => {
      return sum + getSettledOrderAmount(order);
    }, 0);

    const totalRevenue = totalBookingRevenue + totalOrderRevenue; // Gross sales (100%)
    const totalPlatformCommission =
      calculatePlatformCommission(totalBookingRevenue) +
      calculatePlatformCommission(totalOrderRevenue); // Super Admin gets 10% of gross
    const totalMerchantNetRevenue = totalRevenue - totalPlatformCommission; // Providers get 90% of gross

    // Revenue by payment method (bookings)
    const bookingRevenueByMethod = completedBookings.reduce(
      (acc, booking) => {
        if (booking.paymentMethod === "khalti") {
          acc.khalti += booking.payment?.amount || 0;
        } else if (booking.paymentMethod === "cod") {
          acc.cod += booking.payment?.amount || 0;
        }
        return acc;
      },
      { khalti: 0, cod: 0 },
    );

    // Revenue by payment method (orders)
    const orderRevenueByMethod = completedOrders.reduce(
      (acc, order) => {
        if (order.paymentMethod === "khalti") {
          acc.khalti += order.payment?.amount || 0;
        } else if (order.paymentMethod === "cod") {
          acc.cod += order.payment?.amount || 0;
        }
        return acc;
      },
      { khalti: 0, cod: 0 },
    );

    const totalRevenueByMethod = {
      khalti: bookingRevenueByMethod.khalti + orderRevenueByMethod.khalti,
      cod: bookingRevenueByMethod.cod + orderRevenueByMethod.cod,
    };

    // Revenue by booking type
    const revenueByBookingType = completedBookings.reduce((acc, booking) => {
      const type = booking.bookingType;
      acc[type] = (acc[type] || 0) + (booking.payment?.amount || 0);
      return acc;
    }, {});

    // Monthly revenue (last 6 months) - Bookings
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookingRevenue = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
          paymentStatus: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "payment",
          foreignField: "_id",
          as: "paymentDetails",
        },
      },
      {
        $unwind: {
          path: "$paymentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          bookingRevenue: { $sum: "$paymentDetails.amount" },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Monthly revenue (last 6 months) - Orders
    const monthlySettledOrders = await Order.find({
      status: { $in: ["confirmed", "processing", "delivered"] },
      createdAt: { $gte: sixMonthsAgo },
    }).populate("payment");

    const monthlyOrderRevenueMap = new Map();
    monthlySettledOrders.forEach((order) => {
      const settledAmount = getSettledOrderAmount(order);
      if (settledAmount <= 0) {
        return;
      }

      const orderDate = new Date(order.createdAt);
      const key = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
      const existing = monthlyOrderRevenueMap.get(key) || {
        _id: {
          year: orderDate.getFullYear(),
          month: orderDate.getMonth() + 1,
        },
        orderRevenue: 0,
        orders: 0,
      };

      existing.orderRevenue += settledAmount;
      existing.orders += 1;
      monthlyOrderRevenueMap.set(key, existing);
    });

    const monthlyOrderRevenue = Array.from(
      monthlyOrderRevenueMap.values(),
    ).sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    // Combine monthly revenue
    const monthlyRevenueMap = new Map();
    monthlyBookingRevenue.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      monthlyRevenueMap.set(key, {
        year: item._id.year,
        month: item._id.month,
        bookingRevenue: item.bookingRevenue,
        bookings: item.bookings,
        orderRevenue: 0,
        orders: 0,
      });
    });

    monthlyOrderRevenue.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      const existing = monthlyRevenueMap.get(key);
      if (existing) {
        existing.orderRevenue = item.orderRevenue;
        existing.orders = item.orders;
      } else {
        monthlyRevenueMap.set(key, {
          year: item._id.year,
          month: item._id.month,
          bookingRevenue: 0,
          bookings: 0,
          orderRevenue: item.orderRevenue,
          orders: item.orders,
        });
      }
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map((item) => ({
        ...item,
        totalRevenue: item.bookingRevenue + item.orderRevenue,
        totalTransactions: item.bookings + item.orders,
      }));

    // This month's stats
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [thisMonthBookings, thisMonthOrders] = await Promise.all([
      Booking.find({
        status: "confirmed",
        paymentStatus: "completed",
        createdAt: { $gte: thisMonthStart },
      }).populate("payment"),
      Order.find({
        status: { $in: ["confirmed", "processing", "delivered"] },
        createdAt: { $gte: thisMonthStart },
      }).populate("payment"),
    ]);

    const thisMonthBookingRevenue = thisMonthBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.amount || 0);
    }, 0);

    const thisMonthOrderRevenue = thisMonthOrders.reduce((sum, order) => {
      return sum + getSettledOrderAmount(order);
    }, 0);

    const thisMonthRevenue = thisMonthBookingRevenue + thisMonthOrderRevenue;
    const thisMonthPlatformCommission =
      calculatePlatformCommission(thisMonthBookingRevenue) +
      calculatePlatformCommission(thisMonthOrderRevenue);

    // Pending bookings and orders
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["pending", "processing"] },
    });

    // Active providers (those with at least one booking)
    const activeProviders = await Booking.distinct("providerId");

    // Top performing providers
    const topProviders = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
          paymentStatus: "completed",
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "payment",
          foreignField: "_id",
          as: "paymentDetails",
        },
      },
      {
        $unwind: {
          path: "$paymentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$providerId",
          totalRevenue: { $sum: "$paymentDetails.amount" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "serviceproviders",
          localField: "_id",
          foreignField: "_id",
          as: "provider",
        },
      },
      {
        $unwind: "$provider",
      },
      {
        $project: {
          _id: 1,
          name: "$provider.name",
          serviceType: "$provider.serviceType",
          totalRevenue: 1,
          totalBookings: 1,
        },
      },
    ]);

    // Booking status breakdown
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      overview: {
        totalRevenue,
        totalMerchantNetRevenue,
        totalPlatformCommission,
        totalBookingRevenue,
        totalOrderRevenue,
        totalBookings,
        totalOrders,
        totalUsers,
        totalProviders,
        activeProviders: activeProviders.length,
        totalPets,
        totalProducts,
        thisMonthRevenue,
        thisMonthPlatformCommission,
        pendingBookings,
        pendingOrders,
      },
      revenue: {
        byPaymentMethod: totalRevenueByMethod,
        byBookingType: revenueByBookingType,
        monthly: monthlyRevenue,
      },
      topProviders,
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  },
};

export default adminAnalyticsService;
