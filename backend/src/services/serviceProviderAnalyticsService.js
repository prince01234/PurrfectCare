import Booking from "../models/Booking.js";
import mongoose from "mongoose";
import {
  getCommissionBreakdown,
  PLATFORM_COMMISSION_RATE,
} from "../utils/commission.js";

const serviceProviderAnalyticsService = {
  /**
   * Get analytics for a specific service provider.
   * Counts bookings WHERE users booked THIS provider's services (not bookings BY the provider).
   */
  async getProviderAnalytics(providerId) {
    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    // Helper: get amount from a booking (prefer serviceOption.price, fallback to payment)
    const getBookingAmount = (booking) => {
      if (booking.serviceOption?.price) return booking.serviceOption.price;
      if (booking.payment?.amount) return booking.payment.amount;
      return 0;
    };

    // Completed bookings = status "completed" OR "confirmed" (service was provided)
    const completedBookings = await Booking.find({
      providerId: providerObjectId,
      status: { $in: ["completed", "confirmed"] },
    }).populate("payment");

    // Provider revenue is net after 10% platform fee
    const totalGrossRevenue = completedBookings.reduce(
      (sum, b) => sum + getBookingAmount(b),
      0,
    );

    const totalRevenue = completedBookings.reduce((sum, b) => {
      const gross = getBookingAmount(b);
      return sum + getCommissionBreakdown(gross).merchantNet;
    }, 0);

    const totalPlatformCommission = completedBookings.reduce((sum, b) => {
      const gross = getBookingAmount(b);
      return sum + getCommissionBreakdown(gross).platformCommission;
    }, 0);

    // Revenue by payment method
    const revenueByMethod = completedBookings.reduce(
      (acc, booking) => {
        const amount = getCommissionBreakdown(
          getBookingAmount(booking),
        ).merchantNet;
        const method = booking.paymentMethod || "cod";
        if (method === "khalti") {
          acc.khalti += amount;
        } else {
          acc.cod += amount;
        }
        return acc;
      },
      { khalti: 0, cod: 0 },
    );

    // Revenue by service option name
    const revenueByService = completedBookings.reduce((acc, booking) => {
      const name = booking.serviceOption?.name || "General";
      const amount = getCommissionBreakdown(
        getBookingAmount(booking),
      ).merchantNet;
      acc[name] = (acc[name] || 0) + amount;
      return acc;
    }, {});

    // Pending bookings count
    const pendingBookings = await Booking.countDocuments({
      providerId: providerObjectId,
      status: "pending",
    });

    // Upcoming confirmed bookings
    const upcomingBookings = await Booking.countDocuments({
      providerId: providerObjectId,
      status: "confirmed",
      $or: [
        { date: { $gte: new Date() } },
        { startDate: { $gte: new Date() } },
      ],
    });

    // This month's stats
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthCompleted = completedBookings.filter(
      (b) => new Date(b.createdAt) >= thisMonthStart,
    );
    const thisMonthRevenue = thisMonthCompleted.reduce(
      (sum, b) => sum + getCommissionBreakdown(getBookingAmount(b)).merchantNet,
      0,
    );

    // Last month's stats for comparison
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setSeconds(-1);

    const lastMonthCompleted = completedBookings.filter((b) => {
      const d = new Date(b.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const lastMonthRevenue = lastMonthCompleted.reduce(
      (sum, b) => sum + getCommissionBreakdown(getBookingAmount(b)).merchantNet,
      0,
    );

    // Growth percentage
    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
          ? 100
          : 0;

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyMap = {};
    completedBookings
      .filter((b) => new Date(b.createdAt) >= sixMonthsAgo)
      .forEach((b) => {
        const d = new Date(b.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            revenue: 0,
            bookings: 0,
          };
        }
        monthlyMap[key].revenue += getCommissionBreakdown(
          getBookingAmount(b),
        ).merchantNet;
        monthlyMap[key].bookings += 1;
      });

    const monthlyRevenue = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Top services by revenue
    const topServices = Object.entries(revenueByService)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent bookings
    const recentBookings = await Booking.find({
      providerId: providerObjectId,
      status: { $in: ["completed", "confirmed"] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email profileImage")
      .populate("payment");

    return {
      overview: {
        totalRevenue,
        totalGrossRevenue,
        totalPlatformCommission,
        totalBookings: completedBookings.length,
        pendingBookings,
        upcomingBookings,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      revenueByMethod,
      topServices,
      monthlyRevenue,
      recentBookings: recentBookings.map((b) => ({
        id: b._id,
        date: b.date || b.startDate,
        serviceName: b.serviceOption?.name || "General",
        amount: getCommissionBreakdown(getBookingAmount(b)).merchantNet,
        grossAmount: getBookingAmount(b),
        platformCommission: getCommissionBreakdown(getBookingAmount(b))
          .platformCommission,
        commissionRate: PLATFORM_COMMISSION_RATE,
        paymentMethod: b.paymentMethod || "cod",
        status: b.status,
        customer: {
          name: b.userId?.name,
          email: b.userId?.email,
        },
        createdAt: b.createdAt,
      })),
    };
  },
};

export default serviceProviderAnalyticsService;
