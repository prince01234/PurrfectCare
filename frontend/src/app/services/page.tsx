"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Building2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { mapApi } from "@/lib/api/map";
import type { ProviderLocation } from "@/lib/api/map";
import DynamicMapModal from "@/components/ui/DynamicMapModal";
import type { MapMarker } from "@/components/ui/DynamicMapModal";

const SERVICE_FILTERS = [
  { value: "all", label: "All", emoji: "🔍" },
  { value: "veterinary", label: "Vet", emoji: "🩺" },
  { value: "grooming", label: "Grooming", emoji: "✂️" },
  { value: "training", label: "Training", emoji: "🎓" },
  { value: "pet_sitting", label: "Sitting", emoji: "🏠" },
  { value: "other", label: "Other", emoji: "📦" },
];

const SERVICE_LABELS: Record<string, string> = {
  veterinary: "Veterinary",
  grooming: "Grooming",
  training: "Training",
  pet_sitting: "Pet Sitting",
  pet_adoption: "Pet Adoption",
  other: "Other",
};

const SERVICE_EMOJIS: Record<string, string> = {
  veterinary: "🩺",
  grooming: "✂️",
  training: "🎓",
  pet_sitting: "🏠",
  pet_adoption: "🐾",
  other: "📦",
};

export default function ServicesPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [showMap, setShowMap] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [focusProviderId, setFocusProviderId] = useState<string | undefined>();

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    const serviceType = selectedType === "all" ? undefined : selectedType;
    const res = await mapApi.getProviderLocations(serviceType);
    if (res.data?.providers) {
      // Filter out pet_adoption providers — they have their own adopt page
      setProviders(
        res.data.providers.filter((p) => p.serviceType !== "pet_adoption"),
      );
    }
    setIsLoading(false);
  }, [selectedType]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const buildMapMarkers = (list: ProviderLocation[]): MapMarker[] =>
    list.map((p) => ({
      id: p._id,
      latitude: p.latitude,
      longitude: p.longitude,
      title: p.organizationName || p.name,
      subtitle: SERVICE_LABELS[p.serviceType] || p.serviceType,
      description: p.contactAddress || undefined,
      type: p.serviceType,
    }));

  const handleOpenMap = (focusId?: string) => {
    setMapMarkers(buildMapMarkers(providers));
    setFocusProviderId(focusId);
    setShowMap(true);
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Teal accent */}
        <div className="h-1 bg-linear-to-r from-violet-500 to-purple-500" />

        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-800">Pet Services</h1>
            </div>
          </div>

          {/* Service type filter */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {SERVICE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedType(f.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === f.value
                    ? "bg-violet-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-sm">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 font-medium">
                No service providers found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedType !== "all"
                  ? "Try selecting a different service type"
                  : "Service providers will appear here once they join"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-2">
                {providers.length} provider
                {providers.length !== 1 ? "s" : ""} found
              </p>

              {providers.map((provider, index) => (
                <motion.div
                  key={provider._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-2xl shrink-0">
                      {SERVICE_EMOJIS[provider.serviceType] || "📦"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {provider.organizationName || provider.name}
                      </h3>
                      <p className="text-xs text-violet-500 font-medium mt-0.5">
                        {SERVICE_LABELS[provider.serviceType] ||
                          provider.serviceType}
                      </p>

                      {provider.contactAddress && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {provider.contactAddress}
                          </span>
                        </div>
                      )}

                      {provider.contactPhone && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{provider.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* View on Map button */}
                    <button
                      onClick={() => handleOpenMap(provider._id)}
                      className="self-center shrink-0 w-10 h-10 rounded-xl bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors"
                      title="View on Map"
                    >
                      <MapPin className="w-4.5 h-4.5 text-teal-600" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      <DynamicMapModal
        isOpen={showMap}
        onClose={() => {
          setShowMap(false);
          setFocusProviderId(undefined);
        }}
        title="Service Providers"
        markers={mapMarkers}
        focusMarkerId={focusProviderId}
      />
    </MobileLayout>
  );
}
