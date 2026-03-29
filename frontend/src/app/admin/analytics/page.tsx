"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Calendar,
  Store,
  Heart,
  CreditCard,
  Clock,
  RefreshCcw,
  BarChart3,
  Award,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi, PlatformAnalytics } from "@/lib/api";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getPlatformAnalytics();
      const result = response.data as unknown as
        | { data?: PlatformAnalytics; message?: string }
        | undefined;
      if (result?.data) {
        setAnalytics(result.data);
      } else {
        setError(
          result?.message || response.error || "Failed to load analytics",
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 animate-pulse space-y-3"
              >
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
            {error}
          </div>
          <button
            onClick={loadAnalytics}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </AdminLayout>
    );
  }

  if (!analytics) return null;

  const { overview, revenue, topProviders, bookingsByStatus, ordersByStatus } =
    analytics;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Platform Analytics
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Monitor platform-wide performance
              </p>
            </div>
            <button
              onClick={loadAnalytics}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <RefreshCcw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </motion.div>

        {/* Revenue Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-teal-200" />
              <span className="text-xs text-teal-100">
                Super Admin Commission
              </span>
            </div>
            <p className="text-2xl font-bold">
              Rs. {overview.totalPlatformCommission.toLocaleString()}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-teal-100">
              <span>
                Gross Sales: Rs. {overview.totalRevenue.toLocaleString()}
              </span>
              <span>
                Merchant Net: Rs.{" "}
                {overview.totalMerchantNetRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">
                  This Month Commission
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                Rs. {overview.thisMonthPlatformCommission.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Total Bookings</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {overview.totalBookings}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Platform Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Users</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {overview.totalUsers}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500">Providers</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {overview.totalProviders}
            </p>
            <p className="text-[10px] text-gray-400">
              {overview.activeProviders} active
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-xs text-gray-500">Pets</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {overview.totalPets}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Products</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {overview.totalProducts}
            </p>
          </div>
        </motion.div>

        {/* Pending Items */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Pending Items
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-700">
                  {overview.pendingBookings}
                </p>
                <p className="text-[10px] text-amber-600">Bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-3 py-2.5">
              <ShoppingBag className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-bold text-orange-700">
                  {overview.pendingOrders}
                </p>
                <p className="text-[10px] text-orange-600">Orders</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Payment Methods
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm text-gray-700">Khalti</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Rs. {revenue.byPaymentMethod.khalti.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm text-gray-700">Cash on Delivery</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Rs. {revenue.byPaymentMethod.cod.toLocaleString()}
              </span>
            </div>
            {(revenue.byPaymentMethod.khalti > 0 ||
              revenue.byPaymentMethod.cod > 0) && (
              <div className="flex gap-1 rounded-full overflow-hidden h-2">
                <div
                  className="bg-purple-500 rounded-full"
                  style={{
                    width: `${
                      (revenue.byPaymentMethod.khalti /
                        (revenue.byPaymentMethod.khalti +
                          revenue.byPaymentMethod.cod)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      (revenue.byPaymentMethod.cod /
                        (revenue.byPaymentMethod.khalti +
                          revenue.byPaymentMethod.cod)) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Revenue by Booking Type */}
        {Object.keys(revenue.byBookingType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-4 border border-gray-100"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Revenue by Booking Type
            </h3>
            <div className="space-y-2.5">
              {Object.entries(revenue.byBookingType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {type.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Rs. {(amount as number).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly Revenue Trend */}
        {revenue.monthly.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue Trend
              </h3>
            </div>
            <div className="space-y-3">
              {revenue.monthly.map((month, idx) => {
                const maxRev = Math.max(
                  ...revenue.monthly.map((m) => m.totalRevenue),
                  1,
                );
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {MONTH_NAMES[month.month - 1]} {month.year}
                      </span>
                      <span className="font-semibold text-gray-700">
                        Rs. {month.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 flex gap-px overflow-hidden">
                      <div
                        className="bg-blue-500 h-3 rounded-l-full"
                        style={{
                          width: `${(month.bookingRevenue / maxRev) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-emerald-500 h-3 rounded-r-full"
                        style={{
                          width: `${(month.orderRevenue / maxRev) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{month.bookings} bookings</span>
                      <span>{month.orders} orders</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-[10px] text-gray-500">Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-[10px] text-gray-500">Orders</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Providers */}
        {topProviders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Top Providers
              </h3>
            </div>
            {topProviders.map((provider, idx) => (
              <div
                key={provider._id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {provider.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {provider.serviceType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      Rs. {provider.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {provider.totalBookings} bookings
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Status Breakdowns */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Bookings by Status
            </h3>
            <div className="space-y-2">
              {Object.entries(bookingsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Orders by Status
            </h3>
            <div className="space-y-2">
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
