"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { bookingApi } from "@/lib/api/service";
import toast from "react-hot-toast";

export default function KhaltiPaymentCallback() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;

  const [status, setStatus] = useState<"processing" | "success" | "failed">(
    "processing",
  );
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    const confirmPayment = async () => {
      // Get status from query params
      const paymentStatus = searchParams.get("status");
      const purchaseOrderId = searchParams.get("purchase_order_id");

      // Validate booking ID matches
      if (purchaseOrderId && purchaseOrderId !== bookingId) {
        setStatus("failed");
        setMessage("Invalid booking ID");
        toast.error("Payment verification failed");
        return;
      }

      if (!paymentStatus) {
        setStatus("failed");
        setMessage("Payment status not found");
        toast.error("Payment verification failed");
        return;
      }

      // Confirm payment on backend
      const res = await bookingApi.confirmPayment(bookingId, paymentStatus);

      if (res.error) {
        setStatus("failed");
        setMessage(res.error);
        toast.error("Payment confirmation failed");
      } else {
        setStatus("success");
        setMessage("Payment successful! Your booking is confirmed.");
        toast.success("Booking confirmed!");

        // Redirect to bookings after 2 seconds
        setTimeout(() => {
          router.push("/bookings");
        }, 2000);
      }
    };

    if (bookingId) {
      confirmPayment();
    }
  }, [bookingId, searchParams, router]);

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          {status === "processing" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Processing Payment
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="inline-flex items-center gap-2 text-sm text-teal-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to bookings...
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center"
              >
                <XCircle className="w-12 h-12 text-red-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <button
                onClick={() => router.push("/bookings")}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25"
              >
                Go to Bookings
              </button>
            </>
          )}
        </motion.div>
      </div>
    </MobileLayout>
  );
}
