"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Heart,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { adoptionListingApi } from "@/lib/api/adoption";
import type { AdoptionListing } from "@/lib/api/adoption";

const SPECIES_FILTERS = ["All", "Dog", "Cat", "Rabbit", "Bird", "Fish"];
const GENDER_FILTERS = ["All", "Male", "Female"];

export default function AdoptPage() {
  const router = useRouter();

  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const hasFilters =
    speciesFilter !== "All" ||
    genderFilter !== "All" ||
    Boolean(searchQuery.trim());

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    const params: Record<string, string | number> = { limit: 20 };
    if (speciesFilter !== "All") params.species = speciesFilter.toLowerCase();
    if (genderFilter !== "All") params.gender = genderFilter.toLowerCase();
    if (searchQuery.trim()) params.search = searchQuery.trim();
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
    setIsLoading(false);
  }, [speciesFilter, genderFilter, searchQuery, pagination.page]);

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
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Teal accent */}
        <div className="h-1 bg-linear-to-r from-teal-500 to-teal-400" />

        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
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
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  hasFilters
                    ? "bg-teal-50 text-teal-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
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

          {/* Species filter tabs */}
          <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {SPECIES_FILTERS.map((species) => (
              <button
                key={species}
                onClick={() => {
                  setSpeciesFilter(species);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  speciesFilter === species
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {species}
              </button>
            ))}
          </div>

          {/* Gender filter (collapsible) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-3"
            >
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
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results summary */}
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
        </div>

        {/* Listings */}
        <div className="px-5 pt-4 space-y-4">
          {isLoading ? (
            // Skeleton loading
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-52 bg-gray-200" />
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
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4"
                  >
                    {/* Image */}
                    <div className="relative h-52 bg-gray-100">
                      {listing.photos?.[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                          <span className="text-5xl">🐾</span>
                        </div>
                      )}

                      {/* Status badge */}
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow-sm">
                        {listing.status === "available"
                          ? "Available"
                          : "Adopted"}
                      </span>

                      {/* Favorite heart */}
                      <div className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                        <Heart className="w-4.5 h-4.5 text-gray-400" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {listing.name}
                        </h3>
                        <span
                          className={`text-sm font-semibold ${
                            listing.gender === "female"
                              ? "text-pink-500"
                              : "text-blue-500"
                          }`}
                        >
                          {listing.gender.charAt(0).toUpperCase() +
                            listing.gender.slice(1)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        {listing.breed.charAt(0).toUpperCase() +
                          listing.breed.slice(1)}{" "}
                        &bull; {formatAge(listing.age)}
                      </p>

                      {listing.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-teal-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{listing.location}</span>
                        </div>
                      )}
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
