"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Wallet, Info, Smartphone } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

export default function PaymentMethodsPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Payment Methods</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">How payments work</p>
              <p className="text-xs text-blue-600 mt-1">
                Payments are processed securely at checkout. You&apos;ll choose your payment method when placing an order or booking.
              </p>
            </div>
          </div>

          {/* Available Payment Methods */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Available Payment Methods</h2>
            
            <div className="space-y-3">
              {/* Khalti */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Khalti Digital Wallet</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pay securely with your Khalti account</p>
                  </div>
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    Available
                  </span>
                </div>
              </div>

              {/* Cash on Delivery */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pay when you receive your order</p>
                  </div>
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    Available
                  </span>
                </div>
              </div>

              {/* Card - Coming Soon */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">Credit/Debit Card</p>
                    <p className="text-xs text-gray-400 mt-0.5">Visa, Mastercard, and more</p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-400 text-center pt-4">
            All transactions are processed securely. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
