"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

export default function AdoptPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Adopt a Pet</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">🐕</div>
          <p className="text-gray-500 mb-4">Coming soon!</p>
          <p className="text-sm text-gray-400">
            Browse and adopt pets from our adoption partners
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
