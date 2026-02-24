"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function MarketplaceBanner() {
  return (
    <div className="px-5 mt-7">
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
      <Link href="/marketplace?sale=true">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden"
        >
          <div className="p-5 pr-36">
            <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
              SALE
            </span>
            <h3 className="text-gray-900 font-bold text-lg leading-snug">
              Winter Sale
            </h3>
            <p className="text-gray-600 text-sm mt-0.5">Up to 50% off toys</p>
            <div className="mt-3">
              <span className="inline-block bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl">
                Shop Now
              </span>
            </div>
          </div>

          {/* Banner image */}
          <div className="absolute right-0 bottom-0 w-32 h-32">
            <Image
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop"
              alt="Cute dog with toy"
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-tl-2xl"
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
