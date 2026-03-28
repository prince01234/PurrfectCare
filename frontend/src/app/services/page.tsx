"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { serviceProviderApi } from "@/lib/api/service";
import type { ServiceProvider } from "@/lib/api/service";
import { mapApi } from "@/lib/api/map";
import type { ProviderLocation } from "@/lib/api/map";
import DynamicMapModal from "@/components/ui/DynamicMapModal";
import type { MapMarker } from "@/components/ui/DynamicMapModal";
import { useGeolocation, getDistanceKm } from "@/lib/hooks/useGeolocation";

const SERVICE_FILTERS = [
  { value: "all", label: "All" },
  { value: "veterinary", label: "Vet" },
  { value: "grooming", label: "Grooming" },
  { value: "training", label: "Training" },
  { value: "pet_sitting", label: "Sitting" },
  { value: "other", label: "Other" },
];

const SERVICE_LABELS: Record<string, string> = {
  veterinary: "Veterinary",
  grooming: "Grooming",
  training: "Training",
  pet_sitting: "Pet Sitting",
  other: "Other",
};

const SERVICE_COLORS: Record<string, string> = {
  veterinary: "text-teal-600",
  grooming: "text-pink-500",
  training: "text-amber-600",
  pet_sitting: "text-violet-600",
  other: "text-gray-600",
};

function ServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [mapProviders, setMapProviders] = useState<ProviderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [showMap, setShowMap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [focusProviderId, setFocusProviderId] = useState<string | undefined>();
  const latestRequestRef = useRef(0);
  const userCoords = useGeolocation();

  useEffect(() => {
    const queryType = searchParams.get("type");
    const validType = SERVICE_FILTERS.some((f) => f.value === queryType)
      ? queryType
      : null;
    setSelectedType(validType || "all");
  }, [searchParams]);

  const fetchProviders = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    const serviceType = selectedType === "all" ? undefined : selectedType;

    try {
      const [res, mapRes] = await Promise.all([
        serviceProviderApi.getProviders({
          serviceType,
          search: searchQuery.trim() || undefined,
          limit: 50,
        }),
        mapApi.getProviderLocations(serviceType),
      ]);

      if (requestId !== latestRequestRef.current) return;

      setProviders(res.data?.providers || []);
      setMapProviders(
        (mapRes.data?.providers || []).filter(
          (p) => p.serviceType !== "pet_adoption",
        ),
      );
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedType, searchQuery]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const visibleProviders = useMemo(() => {
    if (selectedType === "all") return providers;
    return providers.filter(
      (provider) => provider.serviceType === selectedType,
    );
  }, [providers, selectedType]);

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
    setMapMarkers(buildMapMarkers(mapProviders));
    setFocusProviderId(focusId);
    setShowMap(true);
  };

  const getDistance = (provider: ServiceProvider) => {
    if (!userCoords || !provider.latitude || !provider.longitude) return null;
    return getDistanceKm(
      userCoords.lat,
      userCoords.lng,
      provider.latitude,
      provider.longitude,
    );
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-1 bg-linear-to-r from-teal-500 to-emerald-500" />

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Service type filter (collapsible) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar"
            >
              {SERVICE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedType(f.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedType === f.value
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="flex">
                    <div className="w-32 h-28 bg-gray-200 shrink-0" />
                    <div className="flex-1 p-3.5 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-28" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProviders.length === 0 ? (
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
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">
                {visibleProviders.length} provider
                {visibleProviders.length !== 1 ? "s" : ""} found
              </p>

              {visibleProviders.map((provider, index) => {
                const distance = getDistance(provider);
                return (
                  <motion.div
                    key={provider._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => router.push(`/services/${provider._id}`)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:border-teal-200 transition-all active:scale-[0.98]"
                  >
                    <div className="flex">
                      {/* Cover image */}
                      <div className="w-32 h-28 bg-gray-100 shrink-0 relative overflow-hidden">
                        {provider.coverImage || provider.image ? (
                          <img
                            src={provider.coverImage || provider.image || ""}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                            <span className="text-3xl">
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
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-3.5 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {provider.name}
                            </h3>
                            {provider.rating > 0 && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-bold text-gray-800">
                                  {provider.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-xs font-medium mt-0.5 ${SERVICE_COLORS[provider.serviceType] || "text-gray-500"}`}
                          >
                            {SERVICE_LABELS[provider.serviceType] ||
                              provider.serviceType}
                          </p>
                          {distance != null && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-teal-600">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{distance.toFixed(1)} km</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-teal-600 mt-2">
                          View Details
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout>
          <div className="min-h-screen bg-gray-50" />
        </MobileLayout>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}
