"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Heart,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import { adoptionListingApi } from "@/lib/api/adoption";
import type { AdoptionListing } from "@/lib/api/adoption";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminAdoptionPage() {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const fetchListings = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const result = await adoptionListingApi.getMyListings({
          page,
          limit: 10,
          ...(statusFilter ? { status: statusFilter } : {}),
        });
        if (result.data) {
          setListings(result.data.listings || []);
          setPagination(
            result.data.pagination || { total: 0, page: 1, totalPages: 1 },
          );
        }
      } catch (err) {
        console.error("Fetch listings error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const result = await adoptionListingApi.deleteListing(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing deleted");
    fetchListings(pagination.page);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Adoption Listings</h2>
          <Link
            href="/admin/adoption/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["", "available", "adopted"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-teal-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {status === ""
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">🐾</div>
            <p className="text-gray-500 mb-4">No adoption listings yet</p>
            <Link
              href="/admin/adoption/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing, index) => (
              <motion.div
                key={listing._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex">
                  {/* Photo */}
                  <div className="relative w-24 h-24 bg-gray-100 shrink-0">
                    {listing.photos?.[0] ? (
                      <Image
                        src={listing.photos[0]}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                        <Heart className="w-8 h-8 text-teal-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {listing.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {listing.species} • {listing.breed} • {listing.gender}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          listing.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {listing.status === "available" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Heart className="w-3 h-3" />
                        )}
                        {listing.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      {listing.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {listing.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(listing.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/admin/adoption/${listing._id}`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                      {listing.status === "available" && (
                        <Link
                          href={`/admin/adoption/${listing._id}/edit`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(listing._id, listing.name)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => fetchListings(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === pagination.page
                      ? "bg-teal-500 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
