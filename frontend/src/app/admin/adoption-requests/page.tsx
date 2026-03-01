"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Phone,
  Mail,
  Home,
  PawPrint,
  Baby,
  Loader2,
  Eye,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { adoptionApplicationApi } from "@/lib/api/adoption";
import type { AdoptionApplication, AdoptionListing } from "@/lib/api/adoption";
import AdminLayout from "@/components/layout/AdminLayout";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: React.ElementType; dot: string }
> = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: Clock,
    dot: "bg-amber-400",
  },
  approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: CheckCircle2,
    dot: "bg-emerald-400",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: XCircle,
    dot: "bg-red-400",
  },
};

const LIVING_LABELS: Record<string, string> = {
  house_with_yard: "House with yard",
  house_without_yard: "House without yard",
  apartment: "Apartment",
  farm: "Farm",
  other: "Other",
};

export default function AdminAdoptionRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdoptionAdmin =
    user?.roles === "SUPER_ADMIN" || user?.serviceType === "pet_adoption";

  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  // Detail sheet state
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchApplications = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const result = await adoptionApplicationApi.getAllApplications({
          page,
          limit: 15,
          ...(statusFilter ? { status: statusFilter } : {}),
        });

        if (result.data) {
          setApplications(result.data.applications || []);
          setPagination(
            result.data.pagination || { total: 0, page: 1, totalPages: 1 },
          );
        }
      } catch (err) {
        console.error("Fetch adoption applications error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (!authLoading && !isAdoptionAdmin) return;
    fetchApplications(1);
  }, [authLoading, isAdoptionAdmin, fetchApplications]);

  const handleApprove = async (appId: string) => {
    try {
      setActioningId(appId);
      const result = await adoptionApplicationApi.approveApplication(
        appId,
        reviewNotes || undefined,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application approved! Pet marked as adopted.");
      setReviewNotes("");
      setShowDetail(false);
      setSelectedApp(null);
      fetchApplications(pagination.page);
    } catch {
      toast.error("Failed to approve application");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (appId: string) => {
    if (!reviewNotes.trim()) {
      toast.error("Please add a note before rejecting");
      return;
    }
    try {
      setActioningId(appId);
      const result = await adoptionApplicationApi.rejectApplication(
        appId,
        reviewNotes,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application rejected");
      setReviewNotes("");
      setShowDetail(false);
      setSelectedApp(null);
      fetchApplications(pagination.page);
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getListing = (app: AdoptionApplication): AdoptionListing | null =>
    typeof app.listingId === "object"
      ? (app.listingId as AdoptionListing)
      : null;

  // Client-side search filter
  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const listing = getListing(app);
    const applicantName =
      typeof app.applicantId === "object" ? app.applicantId.name : "";
    return (
      listing?.name?.toLowerCase().includes(q) ||
      applicantName.toLowerCase().includes(q) ||
      app.contactEmail?.toLowerCase().includes(q)
    );
  });

  const openDetail = (app: AdoptionApplication) => {
    setSelectedApp(app);
    setReviewNotes("");
    setShowDetail(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Adoption Requests
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.total} total applications
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by pet name, applicant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <PawPrint className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              No adoption requests found
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {statusFilter
                ? "Try a different filter"
                : "Applications will appear here when users apply"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app, index) => {
              const listing = getListing(app);
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;

              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    onClick={() => openDetail(app)}
                  >
                    <div className="flex gap-3">
                      {/* Pet photo */}
                      <div className="relative w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {listing?.photos?.[0] ? (
                          <Image
                            src={listing.photos[0]}
                            alt={listing.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PawPrint className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {listing?.name || "Unknown Pet"}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ml-2 ${cfg.bg} ${cfg.text}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          From:{" "}
                          <span className="font-medium text-gray-700">
                            {typeof app.applicantId === "object"
                              ? app.applicantId.name
                              : "Unknown"}
                          </span>
                          {" • "}
                          {app.contactEmail}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-400">
                            {formatDate(app.createdAt)}
                          </span>
                          {listing?.species && (
                            <span className="text-[11px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                              {listing.species}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-3">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => fetchApplications(page)}
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

      {/* ─── Detail Bottom Sheet ─── */}
      <AnimatePresence>
        {showDetail &&
          selectedApp &&
          (() => {
            const app = selectedApp;
            const listing = getListing(app);
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key="detail-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
                onClick={() => setShowDetail(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">
                        Application Details
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </div>

                    {/* Pet card */}
                    {listing && (
                      <Link
                        href={`/admin/adoption/${listing._id}`}
                        className="block"
                      >
                        <div className="flex gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                          <div className="relative w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                            {listing.photos?.[0] ? (
                              <Image
                                src={listing.photos[0]}
                                alt={listing.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PawPrint className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {listing.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {listing.breed} • {listing.species}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  listing.status === "available"
                                    ? "bg-green-400"
                                    : "bg-purple-400"
                                }`}
                              />
                              <span className="text-[11px] text-gray-500 capitalize">
                                {listing.status}
                              </span>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                        </div>
                      </Link>
                    )}

                    {/* Applicant info */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        Applicant
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-teal-600">
                              {typeof app.applicantId === "object"
                                ? app.applicantId.name.charAt(0).toUpperCase()
                                : "?"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {typeof app.applicantId === "object"
                                ? app.applicantId.name
                                : "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {typeof app.applicantId === "object"
                                ? app.applicantId.email
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {app.contactPhone}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{app.contactEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-violet-500" />
                        Message
                      </h3>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                        {app.message}
                      </p>
                    </div>

                    {/* Living situation details */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        Living Details
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <Home className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Housing
                          </p>
                          <p className="text-xs font-medium text-gray-700 mt-0.5">
                            {LIVING_LABELS[app.livingSituation] ||
                              app.livingSituation}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <PawPrint className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Other Pets
                          </p>
                          <p className="text-xs font-medium text-gray-700 mt-0.5">
                            {app.hasOtherPets ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <Baby className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Children
                          </p>
                          <p className="text-xs font-medium text-gray-700 mt-0.5">
                            {app.hasChildren ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                      {app.hasOtherPets && app.otherPetsDetails && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="font-medium text-gray-600">
                            Pet details:
                          </span>{" "}
                          {app.otherPetsDetails}
                        </p>
                      )}
                    </div>

                    {/* Review notes if already reviewed */}
                    {app.reviewNotes && app.status !== "pending" && (
                      <div
                        className={`rounded-xl p-3 ${
                          app.status === "approved"
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-semibold mb-1 ${
                            app.status === "approved"
                              ? "text-emerald-700"
                              : "text-red-700"
                          }`}
                        >
                          Review Notes
                        </p>
                        <p
                          className={`text-sm ${
                            app.status === "approved"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {app.reviewNotes}
                        </p>
                      </div>
                    )}

                    {/* Action area for pending apps */}
                    {app.status === "pending" && (
                      <div className="space-y-3 pt-2">
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={2}
                          placeholder="Add review notes (required for rejection)..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/20 transition-all"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(app._id)}
                            disabled={!!actioningId}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {actioningId === app._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(app._id)}
                            disabled={!!actioningId}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {actioningId === app._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-400 text-center pt-1">
                      Submitted on {formatDate(app.createdAt)}
                      {app.reviewedAt &&
                        ` • Reviewed ${formatDate(app.reviewedAt)}`}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </AdminLayout>
  );
}
