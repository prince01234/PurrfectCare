"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  Stethoscope,
  FileText,
  Banknote,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { serviceProviderApi, bookingApi } from "@/lib/api/service";
import { petApi } from "@/lib/api/pet";
import type { ServiceProvider, ServiceOption } from "@/lib/api/service";
import type { Pet } from "@/lib/api/pet";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

/* ── Week helpers ── */
function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const SHORT_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHORT_MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAME_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export default function BookAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const providerId = params.id as string;
  const preselectedServiceId = searchParams.get("service");

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Selection state
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [weekMonday, setWeekMonday] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getMonday(tomorrow);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  // Pet sitting date range
  const [selectedEndDate, setSelectedEndDate] = useState("");

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"khalti" | "cod" | null>(
    null,
  );

  // Booked slots for the selected date
  const [bookedSlots, setBooKedSlots] = useState<string[]>([]);

  const isPetSitting = provider?.serviceType === "pet_sitting";

  // ── Fetch provider & pets ──
  useEffect(() => {
    const load = async () => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setIsLoading(true);
      const [provRes, petRes] = await Promise.all([
        serviceProviderApi.getProviderById(providerId),
        petApi.getPets(),
      ]);
      if (provRes.data) {
        setProvider(provRes.data);
        // Auto-select service option from query param
        if (preselectedServiceId && provRes.data.serviceOptions.length > 0) {
          const match = provRes.data.serviceOptions.find(
            (o) => o._id === preselectedServiceId,
          );
          if (match) setSelectedOption(match);
        }
      }
      if (petRes.data?.pets) setPets(petRes.data.pets);
      setIsLoading(false);
    };
    load();
  }, [providerId, user, router, preselectedServiceId]);

  // ── Fetch booked slots on date change ──
  useEffect(() => {
    if (!selectedDate || !provider || isPetSitting) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    const fetchSlots = async () => {
      const res = await bookingApi.getBookedSlots(
        providerId,
        dateStr,
        selectedOption?.name,
      );
      if (res.data?.bookedSlots) {
        setBooKedSlots(res.data.bookedSlots.map((s) => s.startTime));
      }
    };
    fetchSlots();
  }, [selectedDate, provider, providerId, isPetSitting, selectedOption]);

  // ── Time slots ──
  const timeSlots = useMemo(() => {
    if (!provider || !selectedDate || isPetSitting) return [];

    const dayName = DAY_NAME_MAP[selectedDate.getDay()];
    const avail = provider.availability.find(
      (a) => a.day === dayName && a.isAvailable,
    );
    if (!avail) return [];

    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);
    const duration = provider.slotDuration || 30;

    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;
    const slots: { time: string; label: string; available: boolean }[] = [];

    while (cur + duration <= end) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h > 12 ? h - 12 : h || 12;
      const label = `${displayH}:${m.toString().padStart(2, "0")} ${period}`;

      slots.push({
        time: timeStr,
        label,
        available: !bookedSlots.includes(timeStr),
      });
      cur += duration;
    }
    return slots;
  }, [provider, selectedDate, isPetSitting, bookedSlots]);

  // ── Week navigation dates ──
  const weekDays = useMemo(() => getWeekDays(weekMonday), [weekMonday]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const shiftWeek = useCallback(
    (dir: -1 | 1) => {
      const next = new Date(weekMonday);
      next.setDate(next.getDate() + dir * 7);
      // Don't go before the current week
      if (next < getMonday(today)) return;
      setWeekMonday(next);
      setSelectedDate(null);
      setSelectedTime(null);
    },
    [weekMonday, today],
  );

  // ── Total estimate ──
  const estimateTotal = useMemo(() => {
    if (!selectedOption?.price) return null;
    const numPets = selectedPetIds.length > 0 ? selectedPetIds.length : 1;
    return selectedOption.price * numPets;
  }, [selectedOption, selectedPetIds]);

  // ── Can submit? ──
  const canSubmit = isPetSitting
    ? selectedDate && selectedEndDate
    : selectedDate && selectedTime;

  // ── Show payment modal or submit directly ──
  const handleConfirm = () => {
    if (!provider || !canSubmit) return;

    // If there's a price, show payment modal; otherwise submit directly
    if (estimateTotal && estimateTotal > 0) {
      setShowPaymentModal(true);
    } else {
      handleSubmitBooking(null);
    }
  };

  // ── Submit booking with payment method ──
  const handleSubmitBooking = async (
    selectedPayment: "khalti" | "cod" | null,
  ) => {
    if (!provider || !canSubmit || !selectedPayment) return;

    setIsBooking(true);
    setShowPaymentModal(false);

    const dateStr = selectedDate!.toISOString().split("T")[0];

    // Calculate end time for slot bookings
    let endTime: string | undefined;
    if (!isPetSitting && selectedTime) {
      const slotDur = provider.slotDuration || 30;
      const [h, m] = selectedTime.split(":").map(Number);
      const endMin = h * 60 + m + slotDur;
      endTime = `${Math.floor(endMin / 60)
        .toString()
        .padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;
    }

    const bookingData: Record<string, unknown> = {
      providerId,
      notes: notes || undefined,
      paymentMethod: selectedPayment,
    };
    if (selectedPetIds.length > 0) {
      bookingData.petIds = selectedPetIds;
    }
    if (selectedOption) {
      bookingData.serviceOption = {
        name: selectedOption.name,
        price: selectedOption.price,
        duration: selectedOption.duration,
        serviceCategory: selectedOption.serviceCategory || undefined,
        vaccineType: selectedOption.vaccineType || undefined,
        veterinarian: selectedOption.veterinarian || undefined,
      };
    }
    if (isPetSitting) {
      bookingData.startDate = dateStr;
      bookingData.endDate = selectedEndDate;
    } else {
      bookingData.date = dateStr;
      bookingData.startTime = selectedTime;
      bookingData.endTime = endTime;
    }

    const res = await bookingApi.createBooking(
      bookingData as unknown as Parameters<typeof bookingApi.createBooking>[0],
    );

    if (res.error) {
      toast.error(res.error);
      setIsBooking(false);
      return;
    }

    // If Khalti payment, initiate payment flow
    if (selectedPayment === "khalti" && res.data) {
      const paymentRes = await bookingApi.initiateKhaltiPayment(res.data._id);

      if (paymentRes.error) {
        toast.error("Payment initiation failed: " + paymentRes.error);
        setIsBooking(false);
        return;
      }

      if (paymentRes.data?.payment_url) {
        // Redirect to Khalti payment page
        toast.success("Redirecting to payment...");
        window.location.href = paymentRes.data.payment_url;
        return;
      }
    }

    // For COD or if Khalti URL is missing, just show success
    toast.success("Booking request sent!");
    router.push("/bookings");
    setIsBooking(false);
  };

  // ── Month label for the calendar header ──
  const monthLabel = useMemo(() => {
    if (weekDays.length === 0) return "";
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.getMonth() === last.getMonth()) {
      return `${SHORT_MONTH[first.getMonth()]} ${first.getFullYear()}`;
    }
    return `${SHORT_MONTH[first.getMonth()]} - ${SHORT_MONTH[last.getMonth()]} ${last.getFullYear()}`;
  }, [weekDays]);

  // The service options to display — if preselected, only that one; else all
  const displayOptions = useMemo(() => {
    if (preselectedServiceId && selectedOption) return [selectedOption];
    return provider?.serviceOptions ?? [];
  }, [preselectedServiceId, selectedOption, provider]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!provider) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Provider not found</p>
        </div>
      </MobileLayout>
    );
  }

  // Step numbering helper
  const stepNum = (() => {
    let n = 0;
    return () => ++n;
  })();

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50 pb-36">
        {/* ── Header ── */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900">
                Book Appointment
              </h1>
              <p className="text-xs text-gray-400 truncate">{provider.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
          {/* ── SERVICE INFO CARD ── */}
          {selectedOption && preselectedServiceId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-linear-to-r from-teal-500 to-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-teal-500/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedOption.name}</p>
                    {selectedOption.duration && (
                      <p className="text-xs text-white/75 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {selectedOption.duration} min
                      </p>
                    )}
                    {(selectedOption.serviceCategory ||
                      selectedOption.vaccineType ||
                      selectedOption.veterinarian) && (
                      <p className="text-xs text-white/80 mt-1">
                        {[
                          selectedOption.serviceCategory,
                          selectedOption.vaccineType,
                          selectedOption.veterinarian,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                </div>
                {selectedOption.price != null && (
                  <div className="text-right">
                    <span className="text-lg font-bold">
                      Rs.{selectedOption.price}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SELECT PET ── */}
          {pets.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {stepNum()}
                </span>
                Select Pet(s)
                {selectedPetIds.length > 0 && (
                  <span className="text-xs font-normal text-teal-600 normal-case tracking-normal">
                    ({selectedPetIds.length} selected)
                  </span>
                )}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {pets.map((pet) => {
                  const isSelected = selectedPetIds.includes(pet._id);
                  const photo = pet.photos?.[0];
                  return (
                    <button
                      key={pet._id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPetIds(
                            selectedPetIds.filter((id) => id !== pet._id),
                          );
                        } else {
                          setSelectedPetIds([...selectedPetIds, pet._id]);
                        }
                      }}
                      className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                        isSelected
                          ? "bg-linear-to-br from-teal-50 to-emerald-50 ring-2 ring-teal-500 shadow-md"
                          : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="relative">
                        <div
                          className={`relative w-16 h-16 rounded-full overflow-hidden transition-all ${
                            isSelected
                              ? "ring-2 ring-teal-500 ring-offset-2"
                              : "ring-1 ring-gray-200"
                          }`}
                        >
                          {photo ? (
                            <Image
                              src={photo}
                              alt={pet.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl">
                              🐾
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium max-w-18 truncate ${
                          isSelected ? "text-teal-700" : "text-gray-700"
                        }`}
                      >
                        {pet.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ── SELECT DATE & TIME ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                {stepNum()}
              </span>
              Select Date &amp; Time
            </h3>

            {isPetSitting ? (
              /* Pet sitting: simple date range pickers */
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={
                        selectedDate
                          ? selectedDate.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        setSelectedDate(
                          e.target.value ? new Date(e.target.value) : null,
                        );
                      }}
                      min={
                        new Date(today.getTime() + 86400000)
                          .toISOString()
                          .split("T")[0]
                      }
                      className="w-full p-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all bg-linear-to-br from-gray-50 to-white hover:shadow-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => setSelectedEndDate(e.target.value)}
                      min={
                        selectedDate
                          ? selectedDate.toISOString().split("T")[0]
                          : new Date(today.getTime() + 86400000)
                              .toISOString()
                              .split("T")[0]
                      }
                      className="w-full p-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all bg-linear-to-br from-gray-50 to-white hover:shadow-md"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Normal: week calendar + time slots */
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Calendar header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                  <button
                    onClick={() => shiftWeek(-1)}
                    className="p-2 hover:bg-white rounded-xl transition-all active:scale-95 shadow-sm border border-gray-100"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-50 p-1.5 rounded-lg">
                      <Calendar className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 tracking-tight">
                      {monthLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => shiftWeek(1)}
                    className="p-2 hover:bg-white rounded-xl transition-all active:scale-95 shadow-sm border border-gray-100"
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-2 px-4 py-5 bg-gray-50/30">
                  {weekDays.map((d, i) => {
                    const isPast = d <= today;
                    const dayName = DAY_NAME_MAP[d.getDay()];
                    const avail = provider.availability.find(
                      (a) => a.day === dayName && a.isAvailable,
                    );
                    const disabled = isPast || !avail;
                    const isSelected =
                      selectedDate &&
                      d.toDateString() === selectedDate.toDateString();
                    const isToday =
                      d.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={i}
                        disabled={disabled}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime(null);
                        }}
                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 min-h-17 aspect-square ${
                          isSelected
                            ? "bg-linear-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/40 scale-105"
                            : isToday && !disabled
                              ? "text-teal-600 bg-teal-50 font-bold ring-2 ring-teal-200 shadow-sm"
                              : disabled
                                ? "text-gray-300 cursor-not-allowed bg-white opacity-50"
                                : "text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 bg-white shadow-sm border border-gray-100"
                        } ${!disabled && "active:scale-95"}`}
                      >
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wide mb-1 text-center leading-tight ${
                            isSelected
                              ? "text-white/90"
                              : isToday && !disabled
                                ? "text-teal-600"
                                : "text-gray-500"
                          }`}
                        >
                          {SHORT_DAY[i]}
                        </span>
                        <span
                          className={`text-base font-bold text-center leading-none ${isSelected ? "text-white" : ""}`}
                        >
                          {d.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Time slot pills */}
                {selectedDate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="border-t border-gray-100 px-4 py-5 bg-white"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Available Times
                      </p>
                    </div>
                    {timeSlots.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          No available slots this day
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`flex items-center justify-center py-4 px-4 rounded-xl text-sm font-bold transition-all duration-200 min-h-13 ${
                              selectedTime === slot.time
                                ? "bg-linear-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/40 scale-105"
                                : slot.available
                                  ? "bg-linear-to-br from-gray-50 to-white text-gray-700 hover:from-teal-50 hover:to-teal-50/50 hover:text-teal-700 hover:shadow-md hover:scale-105 border border-gray-200 active:scale-95"
                                  : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 line-through"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {selectedTime === slot.time && (
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="text-center leading-none">
                                {slot.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </motion.section>

          {/* ── SERVICE TYPE (only if no preselected service) ── */}
          {!preselectedServiceId && displayOptions.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {stepNum()}
                </span>
                Service Type
              </h3>
              <div className="space-y-2">
                {displayOptions.map((opt, i) => {
                  const isSelected = selectedOption?._id === opt._id;
                  return (
                    <button
                      key={opt._id || i}
                      onClick={() => setSelectedOption(isSelected ? null : opt)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-teal-400 bg-teal-50/50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-teal-500 bg-teal-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {opt.name}
                          </p>
                          {opt.duration && (
                            <p className="text-xs text-gray-400">
                              {opt.duration} min
                            </p>
                          )}
                        </div>
                      </div>
                      {opt.price != null && (
                        <span className="text-sm font-bold text-gray-800">
                          Rs.{opt.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ── Notes ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-[10px] font-bold">
                <FileText className="w-3 h-3" />
              </span>
              Notes{" "}
              <span className="font-normal text-gray-400 normal-case tracking-normal text-xs">
                (optional)
              </span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or things we should know..."
              rows={3}
              maxLength={1000}
              className="w-full p-3.5 rounded-2xl border border-gray-100 bg-white text-sm focus:border-teal-400 focus:outline-none resize-none shadow-sm placeholder:text-gray-300"
            />
          </motion.section>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Total estimate */}
          {estimateTotal != null && (
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs text-gray-500">Total Estimate</span>
              <span className="text-lg font-bold text-gray-900">
                Rs.{estimateTotal}
              </span>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={!canSubmit || isBooking}
            className="w-full py-3.5 rounded-2xl bg-linear-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-teal-500/25"
          >
            {isBooking ? "Submitting..." : "Confirm Booking"}
          </button>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-end">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Select Payment Method
              </h3>
              {estimateTotal && (
                <p className="text-sm text-gray-500 mt-1">
                  Total:{" "}
                  <span className="font-semibold text-gray-900">
                    Rs.{estimateTotal}
                  </span>
                </p>
              )}
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {/* Khalti Option */}
              <button
                onClick={() => setPaymentMethod("khalti")}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
                  paymentMethod === "khalti"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === "khalti"
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {paymentMethod === "khalti" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-gray-900">
                    Khalti
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay securely with Khalti online payment
                  </p>
                </div>
                <Banknote className="w-6 h-6 text-teal-600 shrink-0" />
              </button>

              {/* Pay at Service Option */}
              <button
                onClick={() => setPaymentMethod("cod")}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
                  paymentMethod === "cod"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === "cod"
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {paymentMethod === "cod" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-gray-900">
                    Pay at Service
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay with cash when you arrive
                  </p>
                </div>
                <Clock className="w-6 h-6 text-teal-600 shrink-0" />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!paymentMethod) {
                    toast.error("Please select a payment method");
                    return;
                  }
                  handleSubmitBooking(paymentMethod);
                }}
                disabled={!paymentMethod || isBooking}
                className="flex-1 py-3 rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
              >
                {isBooking ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MobileLayout>
  );
}
