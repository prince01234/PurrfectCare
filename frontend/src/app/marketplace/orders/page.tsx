"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { orderApi } from "@/lib/api";
import type { Order } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusIcon = {
  pending: Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
};

const statusColor = {
  pending: "text-amber-500",
  confirmed: "text-green-500",
  cancelled: "text-red-400",
};

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const params: Record<string, string | number> = { limit: 50 };
    if (activeTab) params.status = activeTab;
    const res = await orderApi.getOrders(params);
    if (res.data) {
      setOrders(res.data.orders);
    }
    setIsLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [user, authLoading, router, fetchOrders]);

  if (authLoading || !user) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.push("/marketplace")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full"
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400 text-base font-medium">No orders yet</p>
          </div>
        ) : (
          orders.map((order) => {
            const Icon = statusIcon[order.status];
            const color = statusColor[order.status];

            return (
              <Link key={order._id} href={`/marketplace/orders/${order._id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span
                        className={`text-sm font-semibold capitalize ${color}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    #{order._id.slice(-8).toUpperCase()} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-base font-bold text-orange-500">
                      NPR {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
