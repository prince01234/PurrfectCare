"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MapPin, SlidersHorizontal, X } from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { adoptionListingApi } from "@/lib/api/adoption";
import type { AdoptionListing } from "@/lib/api/adoption";
import { useGeolocation, getDistanceKm } from "@/lib/hooks/useGeolocation";

const SPECIES_FILTERS = ["All", "Dog", "Cat", "Rabbit", "Bird", "Fish"];
const GENDER_FILTERS = ["All", "Male", "Female"];

export default function AdoptPage() {
  const router = useRouter();

  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const userCoords = useGeolocation();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const hasFilters =
    speciesFilter !== "All" ||
    genderFilter !== "All" ||
    Boolean(searchQuery.trim());

  const activeFilterCount =
    (speciesFilter !== "All" ? 1 : 0) +
    (genderFilter !== "All" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string | number> = { limit: 20 };
      if (speciesFilter !== "All") params.species = speciesFilter.toLowerCase();
      if (genderFilter !== "All") params.gender = genderFilter.toLowerCase();
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (pagination.page > 1) params.page = pagination.page;

      const res = await adoptionListingApi.getListings(params);
      if (res.data) {
        setListings(res.data.listings);
        setPagination((prev) => ({
          ...prev,
          total: res.data!.pagination.total,
          totalPages: res.data!.pagination.totalPages,
        }));
      }
      if (res.error) {
        setError(res.error);
      }
    } catch {
      setError("Failed to load pets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [speciesFilter, genderFilter, debouncedSearchQuery, pagination.page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const resetFilters = () => {
    setSpeciesFilter("All");
    setGenderFilter("All");
    setSearchQuery("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const formatAge = (months: number) => {
    if (months < 1) return "< 1 mo";
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} yr${years > 1 ? "s" : ""}`;
    return `${years} yr${years > 1 ? "s" : ""} ${rem} mo`;
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-50 pb-24">
        {/* Teal accent */}
        <div className="h-1 bg-linear-to-r from-teal-500 to-teal-400" />

        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Adopt a Pet</h1>
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
                className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  hasFilters
                    ? "bg-teal-50 text-teal-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, breed..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  autoFocus
                  className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
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

          {/* Filter panel (collapsible) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-3"
            >
              <p className="mb-2 text-xs font-medium text-gray-500">Species</p>
              <div className="mb-3 flex gap-2 overflow-x-auto hide-scrollbar">
                {SPECIES_FILTERS.map((species) => (
                  <button
                    key={species}
                    onClick={() => {
                      setSpeciesFilter(species);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      speciesFilter === species
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    {species}
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium text-gray-500 mb-2">Gender</p>
              <div className="flex gap-2">
                {GENDER_FILTERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGenderFilter(g);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      genderFilter === g
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results summary */}
          {(showFilters || hasFilters) && (
            <div className="px-5 pb-3 flex items-center justify-between text-xs text-gray-500">
              <span>
                {pagination.total} pet{pagination.total !== 1 ? "s" : ""}{" "}
                available
              </span>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-teal-600 font-medium hover:text-teal-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="space-y-2 px-5 pt-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{error}</p>
              <button
                onClick={fetchListings}
                className="mt-2 text-teal-700 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            // Skeleton loading
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-24" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="h-3.5 bg-gray-200 rounded w-32" />
                  <div className="h-3.5 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))
          ) : listings.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-5xl mb-4">🐾</div>
              <p className="text-gray-500 font-medium">No pets found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 text-teal-600 text-sm font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {listings.map((listing, index) => (
                <Link key={listing._id} href={`/adopt/${listing._id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      {listing.photos?.[0] ? (
                        <Image
                          src={listing.photos[0]}
                          alt={listing.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                          <span className="text-5xl">🐾</span>
                        </div>
                      )}

                      {/* Status badge */}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                          listing.status === "available"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {listing.status === "available"
                          ? "Available"
                          : "Adopted"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                          {listing.name}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {listing.gender.charAt(0).toUpperCase() +
                            listing.gender.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <p className="line-clamp-1">
                          {listing.breed.charAt(0).toUpperCase() +
                            listing.breed.slice(1)}{" "}
                          &bull; {formatAge(listing.age)}
                        </p>
                        {userCoords &&
                          listing.postedBy?.latitude != null &&
                          listing.postedBy?.longitude != null && (
                            <span className="flex items-center gap-1 text-teal-600 font-medium shrink-0 ml-2">
                              <MapPin className="w-3.5 h-3.5" />
                              {getDistanceKm(
                                userCoords.lat,
                                userCoords.lng,
                                listing.postedBy.latitude,
                                listing.postedBy.longitude,
                              ).toFixed(1)}{" "}
                              km
                            </span>
                          )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                  <button
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.max(1, p.page - 1),
                      }))
                    }
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.min(p.totalPages, p.page + 1),
                      }))
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
