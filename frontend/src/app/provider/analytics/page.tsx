"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Clock,
  Banknote,
  BarChart3,
  RefreshCcw,
  User,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { serviceProviderApi, ServiceProviderAnalytics } from "@/lib/api";

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

export default function ProviderAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ServiceProviderAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceProviderApi.getProviderAnalytics();
      const result = response.data as unknown as
        | { data?: ServiceProviderAnalytics; message?: string }
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
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
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
          {[1, 2].map((i) => (
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

  const {
    overview,
    revenueByMethod,
    monthlyRevenue,
    topServices,
    recentBookings,
  } = analytics;

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((m) => m.revenue),
    1,
  );

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
              <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
              <p className="text-sm text-gray-500 mt-1">
                Revenue from customer bookings
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

        {/* Overview Stats - 2x2 grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-teal-200" />
              <span className="text-xs text-teal-100">Total Revenue</span>
            </div>
            <p className="text-xl font-bold">
              Rs. {overview.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Total Bookings</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {overview.totalBookings}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-500">Pending</span>
            </div>
            <p className="text-xl font-bold text-amber-600">
              {overview.pendingBookings}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Upcoming</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {overview.upcomingBookings}
            </p>
          </div>
        </motion.div>

        {/* This Month Performance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            This Month
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {overview.thisMonthRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Last month: Rs. {overview.lastMonthRevenue.toLocaleString()}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                overview.revenueGrowth >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {overview.revenueGrowth >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {Math.abs(overview.revenueGrowth).toFixed(1)}%
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
                Rs. {revenueByMethod.khalti.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm text-gray-700">Cash on Delivery</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Rs. {revenueByMethod.cod.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            {(revenueByMethod.khalti > 0 || revenueByMethod.cod > 0) && (
              <div className="flex gap-1 rounded-full overflow-hidden h-2">
                <div
                  className="bg-purple-500 rounded-full"
                  style={{
                    width: `${
                      (revenueByMethod.khalti /
                        (revenueByMethod.khalti + revenueByMethod.cod)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      (revenueByMethod.cod /
                        (revenueByMethod.khalti + revenueByMethod.cod)) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Services */}
        {topServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 border border-gray-100"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Top Services
            </h3>
            <div className="space-y-2.5">
              {topServices.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700">
                      {service.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Rs. {service.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly Revenue Trend */}
        {monthlyRevenue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue Trend
              </h3>
            </div>
            <div className="space-y-2.5">
              {monthlyRevenue.map((month, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {MONTH_NAMES[month.month - 1]} {month.year}
                    </span>
                    <span className="font-semibold text-gray-700">
                      Rs. {month.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-teal-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${(month.revenue / maxMonthlyRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {month.bookings} booking{month.bookings !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Bookings
            </h3>
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.customer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.serviceName}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    Rs. {booking.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {new Date(
                      booking.date || booking.createdAt,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.paymentMethod === "khalti"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {booking.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {overview.totalBookings === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-500 font-medium">No booking data yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Analytics will appear once customers book your services
            </p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
