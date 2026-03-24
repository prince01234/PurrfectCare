"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  PawPrint,
  Heart,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  userName?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function HeroSection({
  userName,
  notificationCount = 0,
  onNotificationClick,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-b-4xl bg-linear-to-br from-teal-700 to-teal-600 px-5 pb-6 pt-8 shadow-[0_12px_28px_rgba(15,118,110,0.24)]">
      <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

      {/* Top bar */}
      <div className="relative mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white">
            PurrfectCare
          </h1>
          <p className="mt-1 text-[13px] text-teal-100/95">
            {userName
              ? `Hi ${userName}, stay on top of your pets`
              : "All-in-One Pet Care"}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-white/90">
            QUICK ACTIONS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/12 transition hover:bg-white/20"
          >
            <MessageCircle className="h-4.5 w-4.5 text-white" />
          </Link>

          <button
            type="button"
            onClick={onNotificationClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/12 transition hover:bg-white/20"
          >
            <Bell className="h-4.5 w-4.5 text-white" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Action cards */}
      <div className="relative grid grid-cols-2 gap-3.5">
        <Link href="/pets">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="group flex min-h-24 flex-col justify-between rounded-2xl border border-white/20 bg-white/10 p-3.5 transition hover:bg-white/18"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                <PawPrint className="h-4.5 w-4.5 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/70 transition group-hover:text-white" />
            </div>

            <div className="mt-3.5">
              <p className="text-sm font-semibold text-white">My Pets</p>
              <p className="text-teal-100/95 text-xs">Health & records</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/adopt">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="group flex min-h-24 flex-col justify-between rounded-2xl border border-white/20 bg-white/10 p-3.5 transition hover:bg-white/18"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                <Heart
                  className="h-4.5 w-4.5 text-pink-200"
                  fill="currentColor"
                />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/70 transition group-hover:text-white" />
            </div>

            <div className="mt-3.5">
              <p className="text-sm font-semibold text-white">Adopt</p>
              <p className="text-teal-100/95 text-xs">Find a friend</p>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
