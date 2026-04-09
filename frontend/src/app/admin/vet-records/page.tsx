"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Loader2,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { bookingApi } from "@/lib/api/service";
import { messagingApi } from "@/lib/api/messaging";
import type { Booking } from "@/lib/api/service";

const TABS = [
  { key: "ready", label: "Ready to Complete" },
  { key: "completed", label: "Completed" },
] as const;

type VetRecordsTab = (typeof TABS)[number]["key"];

export default function VetRecordsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VetRecordsTab>("ready");
  const [actionId, setActionId] = useState<string | null>(null);

  const isVeterinary = user?.serviceType === "veterinary";

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const res = await bookingApi.getProviderBookings();
    if (res.error) {
      toast.error(res.error);
      setIsLoading(false);
      return;
    }

    setBookings(res.data?.bookings || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isVeterinary) {
      setIsLoading(false);
      return;
    }

    void fetchBookings();
  }, [fetchBookings, isVeterinary]);

  const veterinaryBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "confirmed" || booking.status === "completed",
      ),
    [bookings],
  );

  const readyBookings = useMemo(
    () =>
      veterinaryBookings.filter((booking) => booking.status === "confirmed"),
    [veterinaryBookings],
  );

  const completedBookings = useMemo(
    () =>
      veterinaryBookings.filter((booking) => booking.status === "completed"),
    [veterinaryBookings],
  );

  const filtered = activeTab === "ready" ? readyBookings : completedBookings;

  const handleComplete = async (bookingId: string) => {
    setActionId(bookingId);
    const res = await bookingApi.completeBooking(bookingId);
    if (res.error) {
      toast.error(res.error);
      setActionId(null);
      return;
    }

    toast.success("Booking completed and health records processed");
    await fetchBookings();
    setActionId(null);
  };

  const handleChatWithUser = async (userId: string) => {
    const res = await messagingApi.getOrCreateConversation({
      recipientId: userId,
      context: "service",
    });

    if (res.data?.conversation) {
      router.push(`/admin/messages/${res.data.conversation._id}`);
      return;
    }

    toast.error("Failed to start conversation");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime12 = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    return `${hours > 12 ? hours - 12 : hours || 12}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const renderBookingDate = (booking: Booking) => {
    if (booking.bookingType === "date_range") {
      return `${formatDate(booking.startDate || booking.createdAt)} -> ${formatDate(booking.endDate || booking.createdAt)}`;
    }

    return formatDate(booking.date || booking.createdAt);
  };

  if (!isVeterinary) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <h2 className="text-lg font-bold text-gray-900">Vet Records</h2>
          <p className="mt-2 text-sm text-gray-500">
            This page is only available for veterinary service providers.
          </p>
          <button
            onClick={() => router.push("/admin/bookings")}
            className="mt-4 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900">Vet Records</h2>
          <p className="mt-1 text-sm text-gray-500">
            Complete veterinary bookings here to keep booking management clean.
            Completing from this screen will run the record automation flow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-teal-100 bg-teal-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-teal-600">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-800">
                How this works
              </p>
              <p className="mt-1 text-xs text-teal-700">
                Use "Complete & Process" after the consultation. The system can
                auto-create vaccination and medical records based on the
                completed booking details.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-2">
          {TABS.map((tab) => {
            const count =
              tab.key === "ready"
                ? readyBookings.length
                : completedBookings.length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-teal-500 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
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

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((index) => (
              <div key={index} className="space-y-3 rounded-2xl bg-white p-5">
                <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-10 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-gray-100 bg-white py-14 text-center"
          >
            <p className="text-sm font-medium text-gray-500">
              {activeTab === "ready"
                ? "No confirmed veterinary bookings to process"
                : "No completed veterinary bookings yet"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((booking) => {
              const userData = booking.userId;
              const userName =
                typeof userData === "object"
                  ? (userData as { name?: string }).name || "Customer"
                  : "Customer";
              const userId =
                typeof userData === "object"
                  ? (userData as { _id?: string })._id || ""
                  : String(userData || "");

              const petNames = Array.isArray(booking.petIds)
                ? booking.petIds
                    .map((pet) => (typeof pet === "object" ? pet.name : ""))
                    .filter(Boolean)
                : [];

              return (
                <motion.div
                  key={booking._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {userName}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {booking.serviceOption?.name ||
                          "Veterinary consultation"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        booking.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {booking.status === "completed"
                        ? "Completed"
                        : "Confirmed"}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {renderBookingDate(booking)}
                    </span>
                    {booking.bookingType === "time_slot" &&
                      booking.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime12(booking.startTime)}
                          {booking.endTime
                            ? ` - ${formatTime12(booking.endTime)}`
                            : ""}
                        </span>
                      )}
                  </div>

                  {petNames.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      🐾 {petNames.join(", ")}
                    </p>
                  )}

                  {booking.status === "confirmed" ? (
                    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleComplete(booking._id)}
                        disabled={actionId === booking._id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                      >
                        {actionId === booking._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Complete & Process
                      </button>
                      <button
                        onClick={() => handleChatWithUser(userId)}
                        className="rounded-xl border-2 border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-teal-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      This booking has already been completed and processed.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </AdminLayout>
  );
}
