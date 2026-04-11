"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  Shield,
  Clock,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Share2,
  Check,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { serviceProviderApi, bookingApi } from "@/lib/api/service";
import { messagingApi } from "@/lib/api/messaging";
import type { ServiceProvider } from "@/lib/api/service";
import { petApi } from "@/lib/api/pet";
import type { Pet } from "@/lib/api/pet";
import { useAuth } from "@/context/AuthContext";
import DynamicMapModal from "@/components/ui/DynamicMapModal";
import type { MapMarker } from "@/components/ui/DynamicMapModal";
import { useGeolocation, getDistanceKm } from "@/lib/hooks/useGeolocation";
import toast from "react-hot-toast";

const SERVICE_LABELS: Record<string, string> = {
  veterinary: "Veterinary",
  grooming: "Grooming",
  training: "Training",
  pet_sitting: "Pet Sitting",
  other: "Other",
};

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const LEGACY_SERVICE_TYPE_PATHS: Record<string, string> = {
  veterinary: "veterinary",
  grooming: "grooming",
  training: "training",
  "pet-sitting": "pet_sitting",
  pet_sitting: "pet_sitting",
  other: "other",
};

type TabKey = "services" | "about" | "reviews";

const DAY_NAME_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

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

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [, setIsDragging] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("services");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekMonday, setWeekMonday] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getMonday(tomorrow);
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const userCoords = useGeolocation();

  const selectedOption =
    provider?.serviceOptions.find(
      (option) => option._id === selectedOptionId,
    ) || null;

  const stepDateTimeReady = Boolean(selectedDate && selectedTime);

  const estimatedTotal =
    selectedOption?.price != null && selectedPetIds.length > 0
      ? selectedOption.price * selectedPetIds.length
      : selectedOption?.price || null;

  const distanceKm =
    userCoords && provider?.latitude && provider?.longitude
      ? getDistanceKm(
          userCoords.lat,
          userCoords.lng,
          provider.latitude,
          provider.longitude,
        )
      : null;

  const galleryImages = useMemo(() => {
    if (!provider) return [];

    const images = [
      provider.coverImage,
      provider.image,
      ...(provider.serviceOptions || []).map((option) => option.image || null),
    ].filter((img): img is string => Boolean(img));

    return [...new Set(images)];
  }, [provider]);

  useEffect(() => {
    const resetPhotoTimer = setTimeout(() => {
      setActivePhoto(0);
    }, 0);

    return () => clearTimeout(resetPhotoTimer);
  }, [provider?._id, galleryImages.length]);

  const nextPhoto = useCallback(() => {
    if (galleryImages.length > 0) {
      setActivePhoto((p) => (p + 1) % galleryImages.length);
    }
  }, [galleryImages.length]);

  const prevPhoto = useCallback(() => {
    if (galleryImages.length > 0) {
      setActivePhoto(
        (p) => (p - 1 + galleryImages.length) % galleryImages.length,
      );
    }
  }, [galleryImages.length]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (galleryImages.length <= 1) return;

      const threshold = 50;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      if (offset < -threshold || velocity < -500) {
        nextPhoto();
      } else if (offset > threshold || velocity > 500) {
        prevPhoto();
      }

      setIsDragging(false);
    },
    [galleryImages.length, nextPhoto, prevPhoto],
  );

  const handleShare = async () => {
    const shareData = {
      title: provider?.name || "Pet Service",
      text: `Check out ${provider?.name || "this provider"} on PurrfectCare`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setJustCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setJustCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setJustCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setJustCopied(false), 2000);
        } catch {
          toast.error("Failed to share");
        }
      }
    }
  };

  useEffect(() => {
    const fetchProvider = async () => {
      const serviceType = LEGACY_SERVICE_TYPE_PATHS[providerId];
      if (serviceType) {
        router.replace(`/services?type=${serviceType}`);
        return;
      }

      const isObjectId = /^[a-f\d]{24}$/i.test(providerId);
      if (!isObjectId) {
        router.replace("/services");
        return;
      }

      setIsLoading(true);
      const res = await serviceProviderApi.getProviderById(providerId);
      if (res.data) {
        setProvider(res.data);
      } else {
        toast.error(res.error || "Service provider not found");
      }
      setIsLoading(false);
    };
    fetchProvider();
  }, [providerId, router]);

  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return;
      const res = await petApi.getPets({ limit: 100 });
      if (res.data?.pets) {
        setPets(res.data.pets);
      }
    };

    fetchPets();
  }, [user]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!provider || !selectedDate || !selectedOption?.name) {
        setBookedSlots([]);
        return;
      }

      const dateStr = selectedDate.toISOString().split("T")[0];

      const res = await bookingApi.getBookedSlots(
        provider._id,
        dateStr,
        selectedOption.name,
      );

      if (res.data?.bookedSlots) {
        setBookedSlots(res.data.bookedSlots.map((slot) => slot.startTime));
      } else {
        setBookedSlots([]);
      }
    };

    fetchBookedSlots();
  }, [provider, selectedDate, selectedOption?.name]);

  const availableTimeSlots = (() => {
    if (!provider || !selectedDate) return [];

    const dayName = DAY_NAME_MAP[selectedDate.getDay()];
    const availability = provider.availability.find(
      (slot) => slot.day === dayName && slot.isAvailable,
    );

    if (!availability) return [];

    const [startHour, startMinute] = availability.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);
    const duration = provider.slotDuration || 30;

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const slots: { value: string; label: string; disabled: boolean }[] = [];

    while (currentMinutes + duration <= endMinutes) {
      const hh = Math.floor(currentMinutes / 60);
      const mm = currentMinutes % 60;
      const value = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

      const displayHour = hh % 12 || 12;
      const period = hh >= 12 ? "PM" : "AM";
      const label = `${displayHour}:${mm.toString().padStart(2, "0")} ${period}`;

      slots.push({
        value,
        label,
        disabled: bookedSlots.includes(value),
      });

      currentMinutes += duration;
    }

    return slots;
  })();

  const resetInlineBookingState = () => {
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedPetIds([]);
    setBookedSlots([]);
  };

  const weekDays = getWeekDays(weekMonday);

  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const shiftWeek = (dir: -1 | 1) => {
    const next = new Date(weekMonday);
    next.setDate(next.getDate() + dir * 7);
    if (next < getMonday(today)) return;
    setWeekMonday(next);
    setSelectedDate(null);
    setSelectedTime("");
  };

  const monthLabel = (() => {
    if (weekDays.length === 0) return "";
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.getMonth() === last.getMonth()) {
      return `${SHORT_MONTH[first.getMonth()]} ${first.getFullYear()}`;
    }
    return `${SHORT_MONTH[first.getMonth()]} - ${SHORT_MONTH[last.getMonth()]} ${last.getFullYear()}`;
  })();

  const handleSelectServiceOption = (optionId?: string) => {
    if (!optionId) return;
    if (selectedOptionId !== optionId) {
      resetInlineBookingState();
    }
    setSelectedOptionId(optionId);
  };

  const handleTogglePet = (petId: string) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId)
        ? prev.filter((currentId) => currentId !== petId)
        : [...prev, petId],
    );
  };

  const handleConfirmInlineBooking = async () => {
    if (!user) {
      toast.error("Please login to book an appointment");
      router.push("/login");
      return;
    }

    if (!provider || !selectedOption || !selectedDate || !selectedTime) {
      toast.error("Please select service, date and time");
      return;
    }

    if (selectedPetIds.length === 0) {
      toast.error("Please select at least one pet");
      return;
    }

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handleSubmitInlineBooking = async (
    selectedPayment: "khalti" | "cod" | null,
  ) => {
    if (!provider || !selectedOption || !selectedDate || !selectedTime) return;
    if (selectedPetIds.length === 0) return;
    if (!selectedPayment) return;

    setIsSubmittingBooking(true);
    setShowPaymentModal(false);

    const duration = provider.slotDuration || 30;
    const [hour, minute] = selectedTime.split(":").map(Number);
    const endMinutes = hour * 60 + minute + duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    const dateStr = selectedDate.toISOString().split("T")[0];

    const res = await bookingApi.createBooking({
      providerId: provider._id,
      petIds: selectedPetIds,
      date: dateStr,
      startTime: selectedTime,
      endTime,
      serviceOption: {
        name: selectedOption.name,
        price: selectedOption.price || undefined,
        duration: selectedOption.duration || undefined,
        serviceCategory: selectedOption.serviceCategory || undefined,
        vaccineType: selectedOption.vaccineType || undefined,
        veterinarian: selectedOption.veterinarian || undefined,
      },
      paymentMethod: selectedPayment,
    });

    if (res.error) {
      toast.error(res.error);
      setIsSubmittingBooking(false);
      return;
    }

    // If Khalti payment, initiate payment flow
    if (selectedPayment === "khalti" && res.data) {
      const paymentRes = await bookingApi.initiateKhaltiPayment(res.data._id);

      if (paymentRes.error) {
        toast.error("Payment initiation failed: " + paymentRes.error);
        setIsSubmittingBooking(false);
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
    toast.success("Booking confirmed");
    router.push("/bookings");
    setIsSubmittingBooking(false);
  };

  const handleStartChat = async () => {
    if (!user || !provider) return;
    setIsStartingChat(true);

    const res = await messagingApi.getOrCreateConversation({
      recipientId: provider.userId._id,
      context: "service",
      contextRef: provider._id,
    });

    if (res.data?.conversation) {
      router.push(`/messages/${res.data.conversation._id}`);
    } else {
      toast.error("Failed to start conversation");
    }

    setIsStartingChat(false);
  };

  const sortedAvailability = provider?.availability
    .filter((a) => a.isAvailable)
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  const mapMarkers: MapMarker[] =
    provider?.latitude && provider?.longitude
      ? [
          {
            id: provider._id,
            latitude: provider.latitude,
            longitude: provider.longitude,
            title: provider.name,
            subtitle:
              SERVICE_LABELS[provider.serviceType] || provider.serviceType,
            description: provider.address || undefined,
            type: provider.serviceType,
          },
        ]
      : [];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "services", label: "Services" },
    { key: "about", label: "About" },
    { key: "reviews", label: "Reviews" },
  ];

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
          <div className="text-center">
            <div className="text-5xl mb-4">😿</div>
            <p className="text-gray-500 font-medium">Provider not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-teal-500 font-medium text-sm"
            >
              Go back
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50 pb-6">
        {/* Cover Image / Hero */}
        <div
          className="relative h-[45vh] min-h-64 bg-gray-200 overflow-hidden"
          ref={containerRef}
        >
          {galleryImages.length > 0 ? (
            <motion.div
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
              drag={galleryImages.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <Image
                src={galleryImages[activePhoto]}
                alt={provider.name}
                fill
                className="object-cover pointer-events-none select-none"
                sizes="(max-width: 32rem) 100vw, 32rem"
                priority
                draggable={false}
              />
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-100 to-emerald-100">
              <span className="text-8xl opacity-40">
                {provider.serviceType === "veterinary"
                  ? "🩺"
                  : provider.serviceType === "grooming"
                    ? "✂️"
                    : provider.serviceType === "training"
                      ? "🎓"
                      : provider.serviceType === "pet_sitting"
                        ? "🏠"
                        : "📦"}
              </span>
            </div>
          )}

          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/30 to-transparent pointer-events-none" />

          {/* Bottom gradient for photo indicators */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Photo indicators */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-20">
              <div className="flex justify-center items-center gap-2">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activePhoto
                        ? "w-7 h-2 bg-white shadow-lg"
                        : "w-2 h-2 bg-white/70 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Provider Info Card — overlaps the cover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 -mt-8 mx-4"
        >
          <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-5">
            {/* Name + Rating */}
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {provider.name}
              </h1>
              {provider.rating > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-gray-800">
                    {provider.rating.toFixed(1)}
                  </span>
                  {provider.totalRatings > 0 && (
                    <span className="text-xs text-gray-400">
                      ({provider.totalRatings})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Verified badge */}
            <div className="flex items-center gap-1.5 mb-3">
              <Shield className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-xs font-medium text-teal-600">
                Verified{" "}
                {SERVICE_LABELS[provider.serviceType] || provider.serviceType}
              </span>
            </div>

            {/* Address + Distance */}
            {provider.address && (
              <button
                onClick={() => {
                  if (provider.latitude && provider.longitude) setShowMap(true);
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors mb-4"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{provider.address}</span>
                {distanceKm != null && (
                  <span className="ml-1 text-teal-600 font-semibold">
                    &bull;{" "}
                    {distanceKm < 1
                      ? `${Math.round(distanceKm * 1000)}m`
                      : `${distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </button>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartChat}
                disabled={isStartingChat || !user}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"
                >
                  <Phone className="w-4.5 h-4.5 text-blue-500" />
                </a>
              )}
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                {justCopied ? (
                  <Check className="w-4.5 h-4.5 text-green-600" />
                ) : (
                  <Share2 className="w-4.5 h-4.5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5">
              {/* ── Services Tab ── */}
              {activeTab === "services" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {provider.serviceOptions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No services listed yet
                    </p>
                  ) : (
                    provider.serviceOptions.map((option, i) => (
                      <button
                        key={option._id || i}
                        onClick={() => handleSelectServiceOption(option._id)}
                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                      >
                        {/* Service option thumbnail */}
                        {option.image && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={option.image}
                              alt={option.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {option.name}
                          </p>
                          {provider.serviceType === "veterinary" &&
                            (option.serviceCategory || option.vaccineType) && (
                              <p className="text-[11px] text-teal-600 mt-0.5">
                                {[option.serviceCategory, option.vaccineType]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {option.duration
                              ? `${option.duration} min`
                              : "Duration varies"}{" "}
                            &bull; Tap to book
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {option.price != null && (
                            <span className="text-sm font-bold text-gray-800">
                              Rs.{option.price}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </button>
                    ))
                  )}

                  {selectedOption && (
                    <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                      <p className="text-sm font-bold text-teal-800">
                        Booking: {selectedOption.name}
                      </p>
                      {provider.serviceType === "veterinary" &&
                        (selectedOption.serviceCategory ||
                          selectedOption.vaccineType ||
                          selectedOption.veterinarian) && (
                          <div className="mt-2 space-y-1 text-xs text-teal-700">
                            {selectedOption.serviceCategory && (
                              <p>Category: {selectedOption.serviceCategory}</p>
                            )}
                            {selectedOption.vaccineType && (
                              <p>Vaccine: {selectedOption.vaccineType}</p>
                            )}
                            {selectedOption.veterinarian && (
                              <p>{selectedOption.veterinarian}</p>
                            )}
                          </div>
                        )}

                      <div className="mt-3 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            1. Select date and time
                          </p>

                          <div className="mt-3 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            {/* Calendar header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                              <button
                                onClick={() => shiftWeek(-1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-500" />
                              </button>
                              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                                {monthLabel}
                              </span>
                              <button
                                onClick={() => shiftWeek(1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 gap-1 px-3 py-3">
                              {weekDays.map((d, i) => {
                                const isPast = d <= today;
                                const dayName = DAY_NAME_MAP[d.getDay()];
                                const avail = provider.availability.find(
                                  (a) => a.day === dayName && a.isAvailable,
                                );
                                const disabled = isPast || !avail;
                                const isSelected =
                                  selectedDate &&
                                  d.toDateString() ===
                                    selectedDate.toDateString();
                                const isToday =
                                  d.toDateString() ===
                                  new Date().toDateString();

                                return (
                                  <button
                                    key={i}
                                    disabled={disabled}
                                    onClick={() => {
                                      setSelectedDate(d);
                                      setSelectedTime("");
                                    }}
                                    className={`flex flex-col items-center py-2.5 rounded-xl transition-all ${
                                      isSelected
                                        ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                                        : isToday && !disabled
                                          ? "text-teal-600 bg-teal-50 font-bold"
                                          : disabled
                                            ? "text-gray-300 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] font-semibold uppercase mb-0.5 ${isSelected ? "text-white/80" : ""}`}
                                    >
                                      {SHORT_DAY[i]}
                                    </span>
                                    <span className="text-sm font-bold">
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
                                className="border-t border-gray-100 px-4 py-3"
                              >
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                  Available Times
                                </p>
                                {availableTimeSlots.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-3">
                                    No available slots this day
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {availableTimeSlots.map((slot) => (
                                      <button
                                        key={slot.value}
                                        disabled={!slot.value || slot.disabled}
                                        onClick={() =>
                                          setSelectedTime(slot.value)
                                        }
                                        className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                                          selectedTime === slot.value
                                            ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                                            : slot.disabled
                                              ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                              : "bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-700 border border-gray-100"
                                        }`}
                                      >
                                        {slot.label}
                                        {slot.disabled ? " (Booked)" : ""}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {stepDateTimeReady && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                              2. Select pet(s)
                            </p>

                            {pets.length === 0 ? (
                              <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500">
                                No pets found. Add a pet first to continue.
                              </div>
                            ) : (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {pets.map((pet) => {
                                  const selected = selectedPetIds.includes(
                                    pet._id,
                                  );
                                  const photo = pet.photos?.[0];

                                  return (
                                    <button
                                      key={pet._id}
                                      type="button"
                                      onClick={() => handleTogglePet(pet._id)}
                                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                                        selected
                                          ? "border-teal-400 bg-teal-100"
                                          : "border-gray-200 bg-white hover:border-teal-300"
                                      }`}
                                    >
                                      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100 shrink-0">
                                        {photo ? (
                                          <Image
                                            src={photo}
                                            alt={pet.name}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center text-xs">
                                            🐾
                                          </div>
                                        )}
                                      </div>
                                      <span className="truncate text-sm font-medium text-gray-800">
                                        {pet.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {stepDateTimeReady && selectedPetIds.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                              3. Confirm booking
                            </p>

                            <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Service</span>
                                <span className="font-semibold text-gray-800">
                                  {selectedOption.name}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-gray-500">When</span>
                                <span className="font-semibold text-gray-800">
                                  {selectedDate
                                    ? selectedDate.toLocaleDateString() +
                                      " " +
                                      selectedTime
                                    : "-"}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-gray-500">Pets</span>
                                <span className="font-semibold text-gray-800">
                                  {selectedPetIds.length}
                                </span>
                              </div>
                              {estimatedTotal != null && (
                                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
                                  <span className="text-gray-600">Total</span>
                                  <span className="font-bold text-gray-900">
                                    Rs.{estimatedTotal}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleConfirmInlineBooking}
                                disabled={isSubmittingBooking}
                                className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                              >
                                {isSubmittingBooking
                                  ? "Confirming..."
                                  : "Confirm booking"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── About Tab ── */}
              {activeTab === "about" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {provider.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {provider.description}
                    </p>
                  )}

                  {/* Facility Amenities */}
                  {provider.amenities && provider.amenities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">
                        Facility Amenities
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {provider.amenities.map((amenity, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 py-2 px-3 rounded-xl bg-teal-50"
                          >
                            <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                            <span className="text-xs font-medium text-teal-700">
                              {amenity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {sortedAvailability && sortedAvailability.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500" />
                        Working Hours
                      </h4>
                      <div className="space-y-1.5">
                        {sortedAvailability.map((slot, i) => (
                          <div
                            key={slot._id || i}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {DAY_LABELS[slot.day] || slot.day}
                            </span>
                            <span className="text-xs text-teal-600 font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">
                      Contact
                    </h4>
                    <div className="space-y-2">
                      {provider.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{provider.phone}</span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{provider.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Reviews Tab ── */}
              {activeTab === "reviews" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-4xl mb-3">⭐</div>
                  <p className="text-sm text-gray-500 font-medium">
                    Reviews coming soon
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Be the first to leave a review after your appointment
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <DynamicMapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        title={provider.name}
        markers={mapMarkers}
        focusMarkerId={provider._id}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-end">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-lg mx-auto bg-white rounded-t-4xl shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Select Payment Method
              </h3>
              {estimatedTotal && (
                <p className="text-sm text-gray-500 mt-1">
                  Total:{" "}
                  <span className="font-semibold text-gray-900">
                    Rs.{estimatedTotal}
                  </span>
                </p>
              )}
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {/* Khalti Option */}
              <button
                onClick={() => handleSubmitInlineBooking("khalti")}
                disabled={isSubmittingBooking}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-emerald-500 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Khalti Wallet
                    </p>
                    <p className="text-xs text-gray-400">Pay online</p>
                  </div>
                </div>
              </button>

              {/* COD Option */}
              <button
                onClick={() => handleSubmitInlineBooking("cod")}
                disabled={isSubmittingBooking}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-teal-500 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Cash on Delivery
                    </p>
                    <p className="text-xs text-gray-400">
                      Pay when service is provided
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmittingBooking}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MobileLayout>
  );
}
