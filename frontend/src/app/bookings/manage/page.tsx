"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
  Trophy,
  HeartPulse,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { bookingApi, serviceProviderApi } from "@/lib/api/service";
import { messagingApi } from "@/lib/api/messaging";
import type { Booking } from "@/lib/api/service";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-50" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100" },
  completed: {
    label: "Completed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "History" },
];

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [providerNotes, setProviderNotes] = useState<Record<string, string>>(
    {},
  );
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [providerServiceType, setProviderServiceType] = useState<string | null>(
    null,
  );

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const res = await bookingApi.getProviderBookings();
    if (res.data?.bookings) {
      setBookings(res.data.bookings);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const provRes = await serviceProviderApi.getMyProvider();
      if (provRes.error) {
        setHasProvider(false);
        setIsLoading(false);
        return;
      }
      setHasProvider(true);
      setProviderServiceType(provRes.data?.serviceType || null);
      fetchBookings();
    };
    init();
  }, [fetchBookings]);

  const isVeterinary = providerServiceType === "veterinary";

  const handleConfirm = async (bookingId: string) => {
    setActionId(bookingId);
    const notes = providerNotes[bookingId];
    const res = await bookingApi.confirmBooking(bookingId, notes || undefined);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Booking confirmed!");
      fetchBookings();
    }
    setActionId(null);
  };

  const handleReject = async (bookingId: string) => {
    setActionId(bookingId);
    const notes = providerNotes[bookingId];
    const res = await bookingApi.rejectBooking(bookingId, notes || undefined);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Booking rejected");
      fetchBookings();
    }
    setActionId(null);
  };

  const handleComplete = async (bookingId: string) => {
    setActionId(bookingId);
    const res = await bookingApi.completeBooking(bookingId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Booking marked as completed!");
      fetchBookings();
    }
    setActionId(null);
  };

  const handleChatWithUser = async (userId: string) => {
    const res = await messagingApi.getOrCreateConversation({
      recipientId: userId,
      context: "service",
    });
    if (res.data?.conversation) {
      router.push(`/messages/${res.data.conversation._id}`);
    } else {
      toast.error("Failed to start conversation");
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === "completed") {
      return ["completed", "rejected", "cancelled"].includes(b.status);
    }
    return b.status === activeTab;
  });

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

  if (hasProvider === false) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-gray-600 font-semibold">
              No Provider Profile Found
            </p>
            <p className="text-gray-400 text-sm mt-2">
              You need a service provider profile to manage bookings.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-6 text-violet-500 font-medium text-sm"
            >
              Go back
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="h-1 bg-linear-to-r from-violet-500 to-purple-500" />

        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Manage Bookings</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex gap-2">
            {TABS.map((tab) => {
              const count =
                tab.key === "completed"
                  ? bookings.filter((b) =>
                      ["completed", "rejected", "cancelled"].includes(b.status),
                    ).length
                  : bookings.filter((b) => b.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-violet-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          {isVeterinary && (
            <button
              onClick={() => router.push("/admin/vet-records")}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"
            >
              <HeartPulse className="h-3.5 w-3.5" /> Vet Records
            </button>
          )}
        </div>

        {/* Bookings */}
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-5xl mb-4">
                {activeTab === "pending"
                  ? "📭"
                  : activeTab === "confirmed"
                    ? "📅"
                    : "📚"}
              </div>
              <p className="text-gray-500 font-medium">
                {activeTab === "pending"
                  ? "No pending bookings"
                  : activeTab === "confirmed"
                    ? "No confirmed bookings"
                    : "No booking history yet"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((booking) => {
                const status =
                  STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                const isPetSitting = booking.bookingType === "date_range";

                // User info
                const userData = booking.userId;
                const userName =
                  typeof userData === "object"
                    ? (userData as { name: string }).name
                    : "Customer";
                const userIdStr =
                  typeof userData === "object"
                    ? (userData as { _id: string })._id
                    : (userData as string);

                return (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    {/* Customer & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {userName}
                        </p>
                        {booking.serviceOption && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.serviceOption.name}
                            {booking.serviceOption.price != null && (
                              <span className="text-emerald-600 font-medium ml-1">
                                Rs. {booking.serviceOption.price}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Date & time */}
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
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
                          {booking.endTime &&
                            ` - ${formatTime12(booking.endTime)}`}
                        </span>
                      )}
                    </div>

                    {/* Pet info */}
                    {booking.petIds && booking.petIds.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        🐾{" "}
                        {booking.petIds
                          .map((p) => (typeof p === "object" ? p.name : p))
                          .join(", ")}
                      </p>
                    )}

                    {/* Customer notes */}
                    {booking.notes && (
                      <div className="mt-2.5 px-3 py-2 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-600">
                            Note:{" "}
                          </span>
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons for pending bookings */}
                    {booking.status === "pending" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                        {/* Provider notes input */}
                        <input
                          type="text"
                          placeholder="Add a note (optional)..."
                          value={providerNotes[booking._id] || ""}
                          onChange={(e) =>
                            setProviderNotes((prev) => ({
                              ...prev,
                              [booking._id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-violet-300 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(booking._id)}
                            disabled={actionId === booking._id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {actionId === booking._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Confirm
                          </button>
                          <button
                            onClick={() => handleReject(booking._id)}
                            disabled={actionId === booking._id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleChatWithUser(userIdStr)}
                            className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-violet-300 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons for confirmed bookings */}
                    {booking.status === "confirmed" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        {isVeterinary ? (
                          <button
                            onClick={() => router.push("/admin/vet-records")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium border border-violet-200 hover:bg-violet-100 transition-colors"
                          >
                            <HeartPulse className="w-4 h-4" />
                            Continue in Vet Records
                          </button>
                        ) : (
                          <button
                            onClick={() => handleComplete(booking._id)}
                            disabled={actionId === booking._id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
                          >
                            {actionId === booking._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trophy className="w-4 h-4" />
                            )}
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleChatWithUser(userIdStr)}
                          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-violet-300 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
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
