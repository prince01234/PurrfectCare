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
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { bookingApi } from "@/lib/api/service";
import { messagingApi } from "@/lib/api/messaging";
import type { Booking, VeterinaryCompletionData } from "@/lib/api/service";

const TABS = [
  { key: "ready", label: "Ready to Complete" },
  { key: "completed", label: "Completed" },
] as const;

type VetRecordsTab = (typeof TABS)[number]["key"];

const todayISODate = () => new Date().toISOString().split("T")[0];

const toInputDate = (value?: string | null) => {
  if (!value) return todayISODate();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayISODate();
  return date.toISOString().split("T")[0];
};

const toDatePlusMonths = (isoDate: string, months: number) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
};

const MEDICAL_CATEGORIES = new Set([
  "consultation",
  "diagnostic",
  "surgery",
  "dental",
  "deworming",
  "other",
]);

const VACCINATION_KEYWORD_REGEX =
  /vaccin|rabies|booster|dhpp|fvrcp|parvo|distemper/i;

const buildCompletionDefaults = (booking: Booking, fallbackVetName: string) => {
  const serviceName =
    booking.serviceOption?.name?.trim() || "Veterinary consultation";
  const serviceCategory =
    booking.serviceOption?.serviceCategory?.trim().toLowerCase() || "";
  const vaccineType = booking.serviceOption?.vaccineType?.trim() || "";
  const bookingDate = toInputDate(
    booking.date || booking.startDate || booking.createdAt,
  );

  const hasVaccinationHint = VACCINATION_KEYWORD_REGEX.test(
    `${serviceName} ${vaccineType} ${booking.notes || ""}`,
  );

  const addVaccination =
    serviceCategory === "vaccination" ||
    (!serviceCategory && hasVaccinationHint);

  const addMedicalRecord =
    MEDICAL_CATEGORIES.has(serviceCategory) ||
    (!serviceCategory && !hasVaccinationHint);

  return {
    addVaccination,
    addMedicalRecord:
      addVaccination || addMedicalRecord ? addMedicalRecord : true,
    vaccineName: addVaccination ? vaccineType || serviceName : "",
    dateGiven: bookingDate,
    nextDueDate: addVaccination ? toDatePlusMonths(bookingDate, 12) : "",
    reasonForVisit: serviceName,
    visitDate: bookingDate,
    vetName: booking.serviceOption?.veterinarian || fallbackVetName,
    symptoms: "",
    treatment: booking.notes || "",
    followUpDate: "",
    notes: booking.notes || "",
  };
};

export default function VetRecordsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<VetRecordsTab>("ready");
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [completionForm, setCompletionForm] = useState({
    addVaccination: false,
    addMedicalRecord: true,
    vaccineName: "",
    dateGiven: todayISODate(),
    nextDueDate: "",
    reasonForVisit: "",
    visitDate: todayISODate(),
    vetName: "",
    symptoms: "",
    treatment: "",
    followUpDate: "",
    notes: "",
  });

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
    if (!isVeterinary) return;

    const fetchTimer = setTimeout(() => {
      void fetchBookings();
    }, 0);

    return () => clearTimeout(fetchTimer);
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

  const openCompleteModal = (booking: Booking) => {
    const fallbackVetName = user?.organizationName || user?.name || "";
    const defaults = buildCompletionDefaults(booking, fallbackVetName);

    setSelectedBooking(booking);
    setCompletionForm(defaults);
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (!selectedBooking) return;

    if (completionForm.addVaccination && !completionForm.vaccineName.trim()) {
      toast.error("Vaccine name is required when adding vaccination");
      return;
    }

    if (
      completionForm.addMedicalRecord &&
      !completionForm.reasonForVisit.trim()
    ) {
      toast.error("Reason for visit is required when adding medical record");
      return;
    }

    const vaccinationDate = new Date(completionForm.dateGiven);
    if (Number.isNaN(vaccinationDate.getTime())) {
      toast.error("Vaccination date is invalid");
      return;
    }

    const visitDate = new Date(completionForm.visitDate);
    if (Number.isNaN(visitDate.getTime())) {
      toast.error("Visit date is invalid");
      return;
    }

    if (completionForm.nextDueDate) {
      const nextDue = new Date(completionForm.nextDueDate);
      if (Number.isNaN(nextDue.getTime()) || nextDue < vaccinationDate) {
        toast.error("Next due date must be on or after vaccination date");
        return;
      }
    }

    if (completionForm.followUpDate) {
      const followUp = new Date(completionForm.followUpDate);
      if (Number.isNaN(followUp.getTime()) || followUp < visitDate) {
        toast.error("Follow-up date must be on or after visit date");
        return;
      }
    }

    const payload: VeterinaryCompletionData = {};

    if (completionForm.addVaccination) {
      const normalizedVetName = completionForm.vetName.trim();
      payload.vaccination = {
        vaccineName: completionForm.vaccineName.trim(),
        dateGiven: completionForm.dateGiven,
        nextDueDate: completionForm.nextDueDate || undefined,
        veterinarian: normalizedVetName || undefined,
        notes: completionForm.notes.trim() || undefined,
      };
    }

    if (completionForm.addMedicalRecord) {
      const symptomList = completionForm.symptoms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      payload.medicalRecord = {
        reasonForVisit: completionForm.reasonForVisit.trim(),
        visitDate: completionForm.visitDate,
        vetName: completionForm.vetName.trim() || undefined,
        symptoms: symptomList.length ? symptomList : undefined,
        treatment: completionForm.treatment.trim() || undefined,
        followUpDate: completionForm.followUpDate || undefined,
        notes: completionForm.notes.trim() || undefined,
      };
    }

    setActionId(selectedBooking._id);
    const res = await bookingApi.completeBooking(
      selectedBooking._id,
      Object.keys(payload).length > 0 ? payload : undefined,
    );
    if (res.error) {
      toast.error(res.error);
      setActionId(null);
      return;
    }

    toast.success("Booking completed and health records processed");
    await fetchBookings();
    setShowCompleteModal(false);
    setSelectedBooking(null);
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
                Use Complete & Process after the consultation. You can add
                detailed vaccination and medical information before completing.
                The system can auto-create vaccination and medical records based
                on the completed booking details.
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
                        onClick={() => openCompleteModal(booking)}
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

      <AnimatePresence>
        {showCompleteModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 p-4"
            onClick={() => {
              setShowCompleteModal(false);
              setSelectedBooking(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="mx-auto mt-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Complete & Process
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Add veterinary details for
                    {` ${selectedBooking.serviceOption?.name || "consultation"} `}
                    before completing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedBooking(null);
                  }}
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={completionForm.addVaccination}
                      onChange={(event) =>
                        setCompletionForm((prev) => ({
                          ...prev,
                          addVaccination: event.target.checked,
                        }))
                      }
                    />
                    Add vaccination record
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={completionForm.addMedicalRecord}
                      onChange={(event) =>
                        setCompletionForm((prev) => ({
                          ...prev,
                          addMedicalRecord: event.target.checked,
                        }))
                      }
                    />
                    Add medical record
                  </label>
                </div>

                <div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Vet Name
                    </label>
                    <input
                      type="text"
                      value={completionForm.vetName}
                      onChange={(event) =>
                        setCompletionForm((prev) => ({
                          ...prev,
                          vetName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {completionForm.addVaccination && (
                  <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                      Vaccination Details
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Vaccine Name *
                        </label>
                        <input
                          type="text"
                          value={completionForm.vaccineName}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              vaccineName: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Date Given
                        </label>
                        <input
                          type="date"
                          value={completionForm.dateGiven}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              dateGiven: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Next Due Date
                        </label>
                        <input
                          type="date"
                          min={completionForm.dateGiven || undefined}
                          value={completionForm.nextDueDate}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              nextDueDate: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {completionForm.addMedicalRecord && (
                  <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Medical Details
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Reason for Visit *
                        </label>
                        <input
                          type="text"
                          value={completionForm.reasonForVisit}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              reasonForVisit: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Visit Date
                        </label>
                        <input
                          type="date"
                          value={completionForm.visitDate}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              visitDate: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          min={completionForm.visitDate || undefined}
                          value={completionForm.followUpDate}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              followUpDate: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Symptoms (comma separated)
                        </label>
                        <input
                          type="text"
                          value={completionForm.symptoms}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              symptoms: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Treatment
                        </label>
                        <textarea
                          rows={2}
                          value={completionForm.treatment}
                          onChange={(event) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              treatment: event.target.value,
                            }))
                          }
                          className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={completionForm.notes}
                    onChange={(event) =>
                      setCompletionForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={actionId === selectedBooking._id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                >
                  {actionId === selectedBooking._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Complete & Process
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
