"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Clock,
  PawPrint,
  AlertTriangle,
} from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { LostFoundPost } from "@/lib/api/lostFound";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

const SPECIES_FILTERS = ["All", "Dog", "Cat", "Bird", "Rabbit", "Other"];

export default function LostAndFoundPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userCoords = useGeolocation();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const params: Record<string, string | number> = {
        limit: 20,
        postType: activeTab,
      };
      if (speciesFilter !== "All") params.species = speciesFilter.toLowerCase();
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (pagination.page > 1) params.page = pagination.page;
      if (userCoords) {
        params.latitude = userCoords.lat;
        params.longitude = userCoords.lng;
      }

      const res = await lostFoundApi.getPosts(params);
      if (res.data) {
        setPosts(res.data.posts);
        setPagination((prev) => ({
          ...prev,
          total: res.data!.pagination.total,
          totalPages: res.data!.pagination.totalPages,
        }));
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, [activeTab, speciesFilter, searchQuery, pagination.page, userCoords]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  const isLostTab = activeTab === "lost";

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Lost & Found</h1>
            </div>
          </div>

          {/* Tabs with underline */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("lost");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`flex-1 py-3.5 text-sm font-semibold text-center transition-all relative ${
                isLostTab ? "text-red-500" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lost Pets
              {isLostTab && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("found");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`flex-1 py-3.5 text-sm font-semibold text-center transition-all relative ${
                !isLostTab
                  ? "text-emerald-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Found Pets
              {!isLostTab && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Search + Filter row */}
          <div className="px-5 py-4 flex items-center gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                placeholder={`Search ${isLostTab ? "lost" : "found"} pets...`}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-300 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${
                speciesFilter !== "All"
                  ? "border-amber-400 bg-amber-50 text-amber-600"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Species filter chips */}
          {showFilters && (
            <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-gray-100">
              {SPECIES_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeciesFilter(s);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    speciesFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pt-4 pb-24">
          {/* Loading */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-16/10 bg-gray-200 rounded-xl" />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty state */
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">
                No {isLostTab ? "lost" : "found"} pets
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery || speciesFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : `No ${isLostTab ? "lost" : "found"} pet reports yet`}
              </p>
            </div>
          ) : (
            /* Posts list */
            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/lost-and-found/${post._id}`} className="block">
                    {/* Card Container */}
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                      {/* Photo section */}
                      <div className="relative w-full aspect-16/10 bg-gray-100 overflow-hidden">
                        {post.photos[0] ? (
                          <Image
                            src={post.photos[0]}
                            alt={post.petName || post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PawPrint className="w-10 h-10 text-gray-300" />
                          </div>
                        )}

                        {/* Type badge - top left */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-md ${
                              post.postType === "lost"
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {post.postType === "lost" ? "LOST" : "FOUND"}
                          </span>
                        </div>

                        {/* Distance badge - bottom right */}
                        {post.distance !== undefined && (
                          <div className="absolute bottom-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/60 backdrop-blur-sm">
                              <MapPin className="w-3 h-3" />
                              {formatDistance(post.distance)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info section */}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-base">
                            {post.petName || `Unknown ${post.species}`}
                          </h3>
                          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDate(post.eventDate)}
                          </span>
                        </div>

                        {post.breed && (
                          <p className="text-xs text-gray-500 mb-2">
                            {post.breed}
                          </p>
                        )}

                        {post.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.description}
                          </p>
                        )}

                        {post.status === "resolved" && (
                          <span className="inline-block px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/lost-and-found/create"
          className="fixed bottom-6 right-5 z-40 w-14 h-14 bg-amber-500 hover:bg-amber-600  text-white rounded-full shadow-lg shadow-amber-500/40 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </MobileLayout>
  );
}
