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
  Truck,
  Star,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { orderApi, productApi } from "@/lib/api";
import type { Order, Product } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StartChatButton from "@/components/chat/StartChatButton";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Pending",
    step: 0,
  },
  confirmed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Confirmed",
    step: 1,
  },
  processing: {
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Processing",
    step: 2,
  },
  dispatched: {
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-50",
    label: "Dispatched",
    step: 3,
  },
  delivered: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "Delivered",
    step: 4,
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
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

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
        // Look up the seller from the first product
        if (res.data.items.length > 0) {
          const productRes = await productApi.getProductById(
            res.data.items[0].productId,
          );
          if (productRes.data) {
            setSellerId(productRes.data.createdBy);
          }
        }
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

  const openRatingForm = () => {
    if (!order) return;
    setRatingValue(order.rating?.score || 0);
    setRatingComment(order.rating?.comment || "");
    setHoverRating(0);
    setIsRatingOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!order) return;

    if (ratingValue < 1 || ratingValue > 5) {
      toast.error("Please select a rating from 1 to 5");
      return;
    }

    setIsSubmittingRating(true);
    const res = await orderApi.submitOrderRating(order._id, {
      score: ratingValue,
      comment: ratingComment.trim() || undefined,
    });

    if (res.data) {
      const hasExistingRating = Boolean(order.rating);
      setOrder(res.data);
      setIsRatingOpen(false);
      setHoverRating(0);
      toast.success(
        hasExistingRating ? "Rating updated" : "Thanks for your rating!",
      );
    } else {
      toast.error(res.error || "Failed to submit rating");
    }

    setIsSubmittingRating(false);
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

  // Calculate estimated delivery (3-5 business days from order date)
  const getEstimatedDelivery = () => {
    const orderDate = new Date(order.createdAt);
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + 3);
    return estimatedDate;
  };

  const estimatedDelivery = getEstimatedDelivery();
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

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

        {/* Estimated Delivery */}
        {!isCancelled && (
          <div className="bg-linear-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    ESTIMATED DELIVERY
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {isDelivered
                      ? "Delivered"
                      : estimatedDelivery.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                  </p>
                </div>
              </div>
              {!isDelivered && (
                <span className="text-xs font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
                  On Track
                </span>
              )}
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Order Timeline
          </h2>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((step) => {
              const statusKey = Object.entries(statusConfig).find(
                ([key, config]) =>
                  config.step === step &&
                  key !== "cancelled" &&
                  !key.includes("colour"),
              )?.[0];
              const stepConfig =
                statusKey &&
                statusConfig[statusKey as keyof typeof statusConfig]
                  ? (statusConfig[
                      statusKey as keyof typeof statusConfig
                    ] as any)
                  : null;

              if (!stepConfig) return null;

              const isCompleted =
                !isCancelled &&
                (statusConfig[order.status] as any).step >= step;
              const isCurrent =
                !isCancelled &&
                (statusConfig[order.status] as any).step === step;
              const StepIcon = stepConfig.icon;

              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-emerald-100"
                          : isCurrent
                            ? "bg-teal-100 ring-2 ring-teal-300"
                            : "bg-gray-100"
                      }`}
                    >
                      <StepIcon
                        className={`w-4 h-4 ${
                          isCompleted
                            ? "text-emerald-600"
                            : isCurrent
                              ? "text-teal-600"
                              : "text-gray-400"
                        }`}
                      />
                    </div>
                    {step < 4 && (
                      <div
                        className={`w-0.5 h-12 mt-2 ${
                          isCompleted ? "bg-emerald-200" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4 pt-1 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? "text-gray-900"
                          : isCurrent
                            ? "text-teal-600"
                            : "text-gray-400"
                      }`}
                    >
                      {stepConfig.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isCompleted
                        ? `Completed on ${new Date(order.createdAt).toLocaleDateString()}`
                        : isCurrent
                          ? "In progress"
                          : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
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

        {/* Rating Section - Show after delivery */}
        {isDelivered && (
          <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  How was your order?
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Share your experience to help other customers
                </p>

                {order.rating && !isRatingOpen ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= order.rating!.score
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        {order.rating.score}/5
                      </span>
                    </div>

                    {order.rating.comment && (
                      <p className="text-xs text-gray-700 bg-white/60 border border-yellow-100 rounded-lg p-2 leading-relaxed">
                        {order.rating.comment}
                      </p>
                    )}

                    <button
                      onClick={openRatingForm}
                      className="w-full bg-white text-yellow-700 font-semibold py-2 rounded-lg hover:bg-yellow-100 transition-colors text-sm border border-yellow-300"
                    >
                      Edit Rating
                    </button>
                  </div>
                ) : isRatingOpen ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1.5">
                        Your rating
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = (hoverRating || ratingValue) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRatingValue(star)}
                              className="p-0.5"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  filled
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="order-rating-comment"
                        className="text-xs text-gray-600 block mb-1"
                      >
                        Comment (optional)
                      </label>
                      <textarea
                        id="order-rating-comment"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Tell us what you liked or what can be improved"
                        className="w-full px-3 py-2 rounded-lg border border-yellow-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-yellow-300"
                      />
                      <p className="text-[11px] text-gray-500 mt-1 text-right">
                        {ratingComment.length}/500
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRatingOpen(false);
                          setHoverRating(0);
                        }}
                        className="flex-1 bg-white text-gray-700 font-semibold py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                        disabled={isSubmittingRating}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitRating}
                        className="flex-1 bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm disabled:opacity-60"
                        disabled={isSubmittingRating || ratingValue === 0}
                      >
                        {isSubmittingRating ? "Saving..." : "Submit Rating"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openRatingForm}
                    className="mt-3 w-full bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Rate Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Message Seller */}
        {sellerId && (
          <StartChatButton
            recipientId={sellerId}
            context="marketplace"
            label="Message Seller"
            variant="secondary"
            className="w-full justify-center"
          />
        )}

        {/* Delivered Order Actions */}
        {isDelivered && (
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-sm border border-emerald-200">
              <RotateCcw className="w-4 h-4" />
              Return Order
            </button>
            <button className="bg-teal-500 text-white font-semibold py-3 rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 text-sm">
              <Package className="w-4 h-4" />
              Reorder
            </button>
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
