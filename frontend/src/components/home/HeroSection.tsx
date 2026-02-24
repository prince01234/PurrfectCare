"use client";

import Link from "next/link";
import { Bell, PawPrint, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  userName?: string;
}

export default function HeroSection({ userName }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-b-[2rem] px-5 pt-12 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            PurrfectCare
          </h1>
          <p className="text-teal-100 text-sm">All-in-One Pet Care</p>
        </div>
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <Bell className="w-5 h-5 text-white" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/pets">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 min-h-[120px] flex flex-col justify-between"
          >
            <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">My Pets</p>
              <p className="text-teal-100 text-xs">Health & records</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/adopt">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 min-h-[120px] flex flex-col justify-between"
          >
            <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-200" fill="currentColor" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">Adopt</p>
              <p className="text-teal-100 text-xs">Find a friend</p>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
