"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { orderApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Suspense } from "react";

function KhaltiCallbackContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const { refreshCart } = useCart();

  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const confirmPayment = async () => {
      // Khalti sends status in query params
      const khaltiStatus = searchParams.get("status");

      const res = await orderApi.confirmPayment(
        orderId,
        khaltiStatus || "Completed",
      );

      // Refresh cart so badge resets
      await refreshCart();

      if (res.data) {
        setStatus("success");
        toast.success("Payment successful!");
        // Auto-redirect to marketplace after 2 seconds
        setTimeout(() => {
          router.push("/marketplace");
        }, 2000);
      } else {
        setStatus("failed");
        toast.error(res.error || "Payment failed");
      }
    };

    confirmPayment();
  }, [orderId, searchParams, user, authLoading, router, refreshCart]);

  return (
    <MobileLayout showBottomNav={false}>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-5">
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-14 h-14 text-teal-500 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">
              Confirming Payment...
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Please wait while we verify your payment
            </p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              Payment Successful!
            </h2>
            <p className="text-sm text-gray-400 mt-1 mb-8">
              Your order has been confirmed
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Redirecting to marketplace...
            </p>
            <button
              onClick={() => router.push("/marketplace")}
              className="bg-teal-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-teal-600 transition-colors"
            >
              Go to Marketplace
            </button>
          </motion.div>
        )}

        {status === "failed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              Payment Failed
            </h2>
            <p className="text-sm text-gray-400 mt-1 mb-8">
              Something went wrong. You can try again from order details.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  router.push(`/marketplace/orders/${orderId}`)
                }
                className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200"
              >
                View Order
              </button>
              <button
                onClick={() => router.push("/marketplace")}
                className="bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-teal-600"
              >
                Marketplace
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function KhaltiCallbackPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout showBottomNav={false}>
          <div className="flex items-center justify-center min-h-[80vh]">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          </div>
        </MobileLayout>
      }
    >
      <KhaltiCallbackContent />
    </Suspense>
  );
}
