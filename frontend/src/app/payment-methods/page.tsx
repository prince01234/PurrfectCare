"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

export default function PaymentMethodsPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-800">
                Payment Methods
              </h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-teal-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 mb-4">No payment methods added</p>
          <p className="text-sm text-gray-400">
            Add a payment method to make it easier to purchase services
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
