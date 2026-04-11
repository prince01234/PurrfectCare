"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { bookingApi } from "@/lib/api/service";
import type { Booking } from "@/lib/api/service";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: X,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: CheckCircle2,
  },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const res = await bookingApi.getUserBookings();
    if (res.data?.bookings) {
      setBookings(res.data.bookings);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const res = await bookingApi.cancelBooking(bookingId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Booking cancelled");
      fetchBookings();
    }
    setCancellingId(null);
  };

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header with filters */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">My Bookings</h1>
          </div>

          {/* Filter Pills inside header */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex flex-wrap gap-2">
            {TABS.map((tab) => {
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bookings list */}
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 animate-pulse space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No bookings found</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab !== "all"
                  ? "Try a different filter"
                  : "Book a service to get started!"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((booking) => {
                const status =
                  STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                const providerData = booking.providerId;
                const isPetSitting = booking.bookingType === "date_range";

                return (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-4 border border-gray-100"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {typeof providerData === "object"
                              ? providerData.name
                              : "Service Provider"}
                          </p>

                          {booking.serviceOption && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {booking.serviceOption.name}
                              {booking.serviceOption.price != null && (
                                <span className="text-emerald-600 font-medium ml-1">
                                  Rs. {booking.serviceOption.price}
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full h-fit ${status.bg}`}
                        >
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${status.color}`}
                          />
                          <span
                            className={`text-xs font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {isPetSitting
                            ? `${formatDate(booking.startDate!)} → ${formatDate(booking.endDate!)}`
                            : formatDate(booking.date!)}
                        </span>
                        {!isPetSitting && booking.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime12(booking.startTime)}
                          </span>
                        )}
                      </div>

                      {booking.petIds && booking.petIds.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Pets:{" "}
                          {booking.petIds
                            .map((p) => (typeof p === "object" ? p.name : p))
                            .join(", ")}
                        </p>
                      )}

                      {booking.providerNotes && (
                        <div className="px-2.5 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">
                            Note: {booking.providerNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {(booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="px-2 py-1 text-sm font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === booking._id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Cancelling...
                            </span>
                          ) : (
                            "Cancel booking"
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
