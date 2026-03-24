"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export default function MarketplaceBanner() {
  return (
    <div className="mt-8 px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-bold text-lg">Marketplace</h2>
        <Link
          href="/marketplace"
          className="text-teal-600 text-sm font-medium hover:text-teal-700"
        >
          View all
        </Link>
      </div>

      {/* Promo banner */}
      <Link href="/marketplace">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="mb-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                MARKETPLACE
              </span>
              <h3 className="text-gray-900 font-bold text-lg leading-snug">
                Daily Pet Essentials
              </h3>
              <p className="mt-0.5 text-sm text-gray-600">
                Food, toys and care products picked for your pets.
              </p>
              <div className="mt-3">
                <span className="inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white">
                  Explore products
                </span>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50">
              <ShoppingBag className="h-8 w-8 text-teal-600" />
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
