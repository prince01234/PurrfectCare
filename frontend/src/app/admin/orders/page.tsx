"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  serviceProviderApi,
  MerchantOrder,
  MerchantOrdersResponse,
} from "@/lib/api";

type OrderStatus = MerchantOrder["status"];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: typeof Clock;
    step?: number;
  }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Clock,
    step: 0,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: CheckCircle2,
    step: 1,
  },
  processing: {
    label: "Processing",
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: Package,
    step: 2,
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: Truck,
    step: 3,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: XCircle,
  },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "delivered",
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Confirm Order",
  confirmed: "Start Processing",
  processing: "Mark Delivered",
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const response = await serviceProviderApi.getMerchantOrders({
          page,
          limit: 15,
          status: statusFilter || undefined,
        });
        const result = response.data as unknown as
          | { data?: MerchantOrdersResponse; message?: string }
          | undefined;
        if (result?.data) {
          setOrders(result.data.orders);
          setPagination(result.data.pagination);
        } else {
          setError(
            result?.message || response.error || "Failed to load orders",
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      setUpdatingOrder(orderId);
      await serviceProviderApi.updateMerchantOrderStatus(orderId, newStatus);
      await loadOrders(pagination.page);
    } catch {
      setError("Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const getEstimatedDelivery = (createdAt: string) => {
    const orderDate = new Date(createdAt);
    const deliveryDate = new Date(
      orderDate.getTime() + 3 * 24 * 60 * 60 * 1000,
    );
    return deliveryDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 rounded-full w-20 animate-pulse shrink-0"
              />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-48" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order History</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {pagination.total} total order
                {pagination.total !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => loadOrders(pagination.page)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={loading}
            >
              <RefreshCcw
                className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.value
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filter.value === "" && <Filter className="w-3 h-3" />}
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Orders List */}
        <AnimatePresence mode="popLayout">
          {orders.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter
                  ? "Try a different filter"
                  : "Orders will appear when customers buy your products"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, idx) => {
                const config = STATUS_CONFIG[order.status];
                const StatusIcon = config.icon;
                const isExpanded = expandedOrder === order._id;
                const nextStatus = NEXT_STATUS[order.status];
                const nextLabel = NEXT_ACTION_LABEL[order.status];
                const isUpdating = updatingOrder === order._id;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    {/* Order Header - always visible */}
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order._id)
                      }
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {order.customer.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""} &middot;{" "}
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                          Rs. {order.merchantTotal.toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                            {/* Estimated Delivery Section */}
                            {order.status !== "cancelled" && (
                              <div className="bg-linear-to-r from-teal-50 to-emerald-50 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Estimated Delivery
                                  </p>
                                  <p className="text-sm font-bold text-teal-600 mt-0.5">
                                    {getEstimatedDelivery(order.createdAt)}
                                  </p>
                                </div>
                                <span className="px-2.5 py-1 bg-white text-teal-600 text-xs font-semibold rounded-full border border-teal-200">
                                  On Track
                                </span>
                              </div>
                            )}

                            {/* Order Timeline */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Delivery Timeline
                              </p>
                              <div className="space-y-2">
                                {(
                                  [
                                    "pending",
                                    "confirmed",
                                    "processing",
                                    "delivered",
                                  ] as OrderStatus[]
                                ).map((s, i) => {
                                  const stepConfig = STATUS_CONFIG[s];
                                  const StepIcon = stepConfig.icon;
                                  const steps = [
                                    "pending",
                                    "confirmed",
                                    "processing",
                                    "delivered",
                                  ];
                                  const currentIdx = steps.indexOf(
                                    order.status,
                                  );
                                  const stepIdx = i;
                                  const isCompleted =
                                    order.status !== "cancelled" &&
                                    stepIdx <= currentIdx;
                                  const isCurrent =
                                    order.status !== "cancelled" &&
                                    stepIdx === currentIdx;
                                  const isCancelled =
                                    order.status === "cancelled";

                                  return (
                                    <div
                                      key={s}
                                      className="flex items-center gap-3"
                                    >
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs transition-colors ${
                                          isCancelled
                                            ? "bg-gray-100 text-gray-400"
                                            : isCompleted
                                              ? "bg-emerald-500 text-white"
                                              : isCurrent
                                                ? "bg-teal-100 text-teal-600 ring-2 ring-teal-300"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                                      >
                                        <StepIcon className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`text-sm font-medium ${
                                            isCancelled
                                              ? "text-gray-400"
                                              : isCompleted
                                                ? "text-emerald-600"
                                                : isCurrent
                                                  ? "text-teal-600"
                                                  : "text-gray-400"
                                          }`}
                                        >
                                          {stepConfig.label}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {stepIdx === 0
                                            ? "Order placed"
                                            : stepIdx === 1
                                              ? "Payment confirmed"
                                              : stepIdx === 2
                                                ? "Being prepared"
                                                : "On its way"}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                                {order.status === "cancelled" && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-500 shrink-0">
                                      <XCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-red-600">
                                        Cancelled
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        This order has been cancelled
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Items
                              </p>
                              {order.items.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    {item.imageSnapshot ? (
                                      <Image
                                        src={item.imageSnapshot}
                                        alt={item.nameSnapshot}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm text-gray-800">
                                        {item.nameSnapshot}
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        Qty: {item.quantity} × Rs.{" "}
                                        {item.priceSnapshot.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    Rs.{" "}
                                    {(
                                      item.priceSnapshot * item.quantity
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Customer & Delivery Info */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-800">
                                    {order.customer.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {order.customer.email}
                                  </p>
                                  {order.customer.phone && (
                                    <p className="text-xs text-gray-400">
                                      {order.customer.phone}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {order.deliveryAddress && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                  <p className="text-sm text-gray-600">
                                    {order.deliveryAddress}
                                  </p>
                                </div>
                              )}

                              {order.notes && (
                                <div className="flex items-start gap-2">
                                  <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                  <p className="text-sm text-gray-600 italic">
                                    {order.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Payment Info */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                {order.paymentMethod === "khalti" ? (
                                  <CreditCard className="w-4 h-4 text-purple-500" />
                                ) : (
                                  <Banknote className="w-4 h-4 text-emerald-500" />
                                )}
                                <span className="text-sm text-gray-700">
                                  {order.paymentMethod === "khalti"
                                    ? "Khalti"
                                    : "Cash on Delivery"}
                                </span>
                              </div>
                              {order.payment && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    order.payment.status === "completed"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : order.payment.status === "pending"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {order.payment.status}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {nextStatus && nextLabel && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(order._id, nextStatus)
                                  }
                                  disabled={isUpdating}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <StatusIcon className="w-4 h-4" />
                                      {nextLabel}
                                    </>
                                  )}
                                </button>
                              )}
                              {(order.status === "pending" ||
                                order.status === "confirmed") && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(order._id, "cancelled")
                                  }
                                  disabled={isUpdating}
                                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between pt-2"
          >
            <button
              onClick={() => loadOrders(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadOrders(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
