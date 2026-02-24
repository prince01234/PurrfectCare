"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  MapPin,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { orderApi } from "@/lib/api";
import type { Order } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Pending",
  },
  confirmed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Confirmed",
  },
  cancelled: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Cancelled",
  },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const fetchOrder = async () => {
      setIsLoading(true);
      const res = await orderApi.getOrderById(orderId);
      if (res.data) {
        setOrder(res.data);
      } else {
        toast.error("Order not found");
        router.push("/marketplace");
      }
      setIsLoading(false);
    };
    if (orderId) fetchOrder();
  }, [orderId, user, router]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    const res = await orderApi.cancelOrder(order._id);
    if (res.data) {
      setOrder(res.data.order);
      toast.success("Order cancelled");
    } else {
      toast.error(res.error || "Failed to cancel");
    }
    setIsCancelling(false);
  };

  const handlePayNow = async () => {
    if (!order) return;
    const res = await orderApi.initiateKhaltiPayment(order._id);
    if (res.data?.payment_url) {
      window.location.href = res.data.payment_url;
    } else {
      toast.error(res.error || "Failed to initiate payment");
    }
  };

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

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  if (!order) return null;

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.push("/marketplace/orders")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
        </div>
      </div>

      <div className="px-5 py-5 pb-32 space-y-5">
        {/* Status */}
        <div className={`${status.bg} rounded-2xl p-5 flex items-center gap-4`}>
          <StatusIcon className={`w-10 h-10 ${status.color}`} />
          <div>
            <p className={`text-lg font-bold ${status.color}`}>
              {status.label}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Items ({order.items.length})
          </h2>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                  {item.imageSnapshot ? (
                    <Image
                      src={item.imageSnapshot}
                      alt={item.nameSnapshot}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {item.nameSnapshot}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  NPR {(item.priceSnapshot * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery */}
        {order.deliveryAddress && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <MapPin className="w-4 h-4 text-teal-500" />
              Delivery Address
            </h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              {order.deliveryAddress}
            </p>
          </div>
        )}

        {/* Payment */}
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <CreditCard className="w-4 h-4 text-teal-500" />
            Payment
          </h2>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900 capitalize">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Khalti"}
              </span>
            </div>
            {order.payment && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span
                  className={`font-medium capitalize ${
                    order.payment.status === "completed"
                      ? "text-green-600"
                      : order.payment.status === "failed"
                        ? "text-red-500"
                        : "text-amber-500"
                  }`}
                >
                  {order.payment.status}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-orange-500 font-bold">
                NPR {order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Bottom actions for pending orders */}
      {order.status === "pending" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
            {order.paymentMethod === "khalti" &&
              (!order.payment || order.payment.status !== "completed") && (
                <button
                  onClick={handlePayNow}
                  className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-xl hover:bg-teal-600 transition-colors"
                >
                  Pay Now
                </button>
              )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
