"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { orderApi } from "@/lib/api";

type PaymentMethod = "khalti" | "cod";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, totalPrice, refreshCart } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("khalti");
  const [isPlacing, setIsPlacing] = useState(false);

  const [orderPlaced, setOrderPlaced] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Only redirect to cart if we haven't started placing an order
    if (items.length === 0 && !orderPlaced) {
      router.push("/marketplace/cart");
    }
  }, [user, authLoading, items.length, orderPlaced, router]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsPlacing(true);

    const res = await orderApi.createOrder({
      paymentMethod,
      deliveryAddress: deliveryAddress.trim(),
      notes: notes.trim() || undefined,
    });

    if (res.error) {
      toast.error(res.error);
      setIsPlacing(false);
      return;
    }

    const order = res.data!;
    setOrderPlaced(true);

    if (paymentMethod === "khalti") {
      // Initiate Khalti payment BEFORE refreshing cart
      const paymentRes = await orderApi.initiateKhaltiPayment(order._id);
      if (paymentRes.data?.payment_url) {
        // Redirect to Khalti — don't refresh cart, page will unmount
        window.location.href = paymentRes.data.payment_url;
        return;
      } else {
        toast.error(
          paymentRes.error ||
            "Failed to initiate payment. You can pay later from orders.",
        );
        await refreshCart();
        router.push(`/marketplace/orders/${order._id}`);
      }
    } else {
      // COD — refresh cart then go to confirmation
      await refreshCart();
      toast.success("Order placed successfully!");
      router.push(`/marketplace/orders/${order._id}`);
    }

    setIsPlacing(false);
  };

  if (authLoading || !user || (items.length === 0 && !orderPlaced)) {
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
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="px-5 py-5 pb-40 space-y-5">
        {/* Order summary */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Order Summary ({items.length} item{items.length > 1 ? "s" : ""})
          </h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
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

        {/* Delivery address */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <MapPin className="w-4 h-4 text-teal-500" />
            Delivery Address
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your full delivery address..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <FileText className="w-4 h-4 text-teal-500" />
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
          />
        </div>

        {/* Payment method */}
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <CreditCard className="w-4 h-4 text-teal-500" />
            Payment Method
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod("khalti")}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === "khalti"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">K</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Khalti</p>
                <p className="text-xs text-gray-400">
                  Pay securely via Khalti wallet
                </p>
              </div>
              <div
                className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === "khalti"
                    ? "border-teal-500"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "khalti" && (
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("cod")}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === "cod"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Cash on Delivery
                </p>
                <p className="text-xs text-gray-400">
                  Pay when you receive the order
                </p>
              </div>
              <div
                className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === "cod"
                    ? "border-teal-500"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "cod" && (
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm">Total</span>
            <span className="text-xl font-bold text-gray-900">
              NPR {totalPrice.toFixed(2)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceOrder}
            disabled={isPlacing}
            className="w-full bg-teal-500 text-white font-semibold py-3.5 rounded-xl hover:bg-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPlacing
              ? "Placing Order..."
              : paymentMethod === "khalti"
                ? "Pay with Khalti"
                : "Place Order (COD)"}
          </motion.button>
        </div>
      </div>
    </MobileLayout>
  );
}
