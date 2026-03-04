import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const marketplaceAnalyticsService = {
  /**
   * Get marketplace analytics for a specific admin.
   * Tracks products they created and orders containing those products.
   */
  async getMarketplaceAnalytics(adminUserId) {
    const adminObjectId = new mongoose.Types.ObjectId(adminUserId);

    // ── Products owned by this admin ──
    const allProducts = await Product.find({ createdBy: adminObjectId });
    const productIds = allProducts.map((p) => p._id);

    const activeProducts = allProducts.filter((p) => p.isActive).length;
    const inactiveProducts = allProducts.length - activeProducts;

    // Low stock products (stockQty not null and <= 5)
    const lowStockProducts = allProducts
      .filter((p) => p.isActive && p.stockQty !== null && p.stockQty <= 5)
      .map((p) => ({
        id: p._id,
        name: p.name,
        stockQty: p.stockQty,
        price: p.price,
        category: p.category,
      }));

    // ── Orders containing this admin's products ──
    const allOrders = await Order.find({
      "items.productId": { $in: productIds },
    }).populate("payment");

    // Helper: compute revenue from order items belonging to this admin only
    const getAdminRevenue = (order) => {
      const productIdSet = new Set(productIds.map((id) => id.toString()));
      return order.items
        .filter((item) => productIdSet.has(item.productId.toString()))
        .reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
    };

    // Helper: count items belonging to this admin
    const getAdminItemCount = (order) => {
      const productIdSet = new Set(productIds.map((id) => id.toString()));
      return order.items
        .filter((item) => productIdSet.has(item.productId.toString()))
        .reduce((sum, item) => sum + item.quantity, 0);
    };

    // Fulfilled orders (confirmed, processing, or delivered)
    const confirmedOrders = allOrders.filter((o) =>
      ["confirmed", "processing", "delivered"].includes(o.status),
    );
    const pendingOrders = allOrders.filter((o) => o.status === "pending");

    // Total revenue from confirmed orders (this admin's items only)
    const totalRevenue = confirmedOrders.reduce(
      (sum, o) => sum + getAdminRevenue(o),
      0,
    );

    // Total items sold
    const totalItemsSold = confirmedOrders.reduce(
      (sum, o) => sum + getAdminItemCount(o),
      0,
    );

    // Revenue by payment method
    const revenueByMethod = confirmedOrders.reduce(
      (acc, order) => {
        const amount = getAdminRevenue(order);
        const method = order.paymentMethod || "cod";
        if (method === "khalti") {
          acc.khalti += amount;
        } else {
          acc.cod += amount;
        }
        return acc;
      },
      { khalti: 0, cod: 0 },
    );

    // ── This month vs last month ──
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setSeconds(-1);

    const thisMonthOrders = confirmedOrders.filter(
      (o) => new Date(o.createdAt) >= thisMonthStart,
    );
    const lastMonthOrders = confirmedOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, o) => sum + getAdminRevenue(o),
      0,
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, o) => sum + getAdminRevenue(o),
      0,
    );

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
          ? 100
          : 0;

    // ── Monthly revenue (last 6 months) ──
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyMap = {};
    confirmedOrders
      .filter((o) => new Date(o.createdAt) >= sixMonthsAgo)
      .forEach((o) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            revenue: 0,
            orders: 0,
            itemsSold: 0,
          };
        }
        monthlyMap[key].revenue += getAdminRevenue(o);
        monthlyMap[key].orders += 1;
        monthlyMap[key].itemsSold += getAdminItemCount(o);
      });

    const monthlyRevenue = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // ── Top selling products by revenue ──
    const productRevenueMap = {};
    const productIdSet = new Set(productIds.map((id) => id.toString()));

    confirmedOrders.forEach((order) => {
      order.items
        .filter((item) => productIdSet.has(item.productId.toString()))
        .forEach((item) => {
          const pid = item.productId.toString();
          if (!productRevenueMap[pid]) {
            productRevenueMap[pid] = {
              productId: pid,
              name: item.nameSnapshot,
              revenue: 0,
              quantitySold: 0,
            };
          }
          productRevenueMap[pid].revenue += item.priceSnapshot * item.quantity;
          productRevenueMap[pid].quantitySold += item.quantity;
        });
    });

    const topProducts = Object.values(productRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Revenue by category ──
    const productCategoryMap = {};
    allProducts.forEach((p) => {
      productCategoryMap[p._id.toString()] = p.category;
    });

    const revenueByCategory = {};
    confirmedOrders.forEach((order) => {
      order.items
        .filter((item) => productIdSet.has(item.productId.toString()))
        .forEach((item) => {
          const category =
            productCategoryMap[item.productId.toString()] || "other";
          revenueByCategory[category] =
            (revenueByCategory[category] || 0) +
            item.priceSnapshot * item.quantity;
        });
    });

    // ── Recent orders (latest 10) ──
    const recentOrders = await Order.find({
      "items.productId": { $in: productIds },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email profileImage")
      .populate("payment");

    return {
      overview: {
        totalRevenue,
        totalOrders: confirmedOrders.length,
        pendingOrders: pendingOrders.length,
        totalProducts: allProducts.length,
        activeProducts,
        inactiveProducts,
        totalItemsSold,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      revenueByMethod,
      revenueByCategory,
      topProducts,
      monthlyRevenue,
      lowStockProducts,
      recentOrders: recentOrders.map((o) => {
        // Only include items from this admin
        const adminItems = o.items.filter((item) =>
          productIdSet.has(item.productId.toString()),
        );
        const orderRevenue = adminItems.reduce(
          (sum, item) => sum + item.priceSnapshot * item.quantity,
          0,
        );
        return {
          id: o._id,
          status: o.status,
          paymentMethod: o.paymentMethod,
          totalAmount: orderRevenue,
          itemCount: adminItems.reduce((sum, item) => sum + item.quantity, 0),
          items: adminItems.map((item) => ({
            name: item.nameSnapshot,
            quantity: item.quantity,
            price: item.priceSnapshot,
          })),
          customer: {
            name: o.userId?.name,
            email: o.userId?.email,
          },
          createdAt: o.createdAt,
        };
      }),
    };
  },
};

export default marketplaceAnalyticsService;
