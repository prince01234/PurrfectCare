"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  Star,
  Shield,
  Clock,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { serviceProviderApi } from "@/lib/api/service";
import { messagingApi } from "@/lib/api/messaging";
import type { ServiceProvider } from "@/lib/api/service";
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

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("services");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const userCoords = useGeolocation();

  const distanceKm =
    userCoords && provider?.latitude && provider?.longitude
      ? getDistanceKm(
          userCoords.lat,
          userCoords.lng,
          provider.latitude,
          provider.longitude,
        )
      : null;

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
        <div className="relative h-[45vh] min-h-64 bg-gray-200">
          {provider.coverImage ? (
            <Image
              src={provider.coverImage}
              alt={provider.name}
              fill
              className="object-cover"
            />
          ) : provider.image ? (
            <Image
              src={provider.image}
              alt={provider.name}
              fill
              className="object-cover"
            />
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

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Right actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-pink-400" />
            </button>
          </div>
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
              <button className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5 text-amber-500" />
              </button>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"
                >
                  <Phone className="w-4.5 h-4.5 text-blue-500" />
                </a>
              )}
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
                        onClick={() => {
                          if (!user) {
                            toast.error("Please login to book an appointment");
                            router.push("/login");
                            return;
                          }
                          router.push(
                            `/services/${provider._id}/book?service=${option._id}`,
                          );
                        }}
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
    </MobileLayout>
  );
}
