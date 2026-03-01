"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Heart,
  MapPin,
  Calendar,
  ChevronRight,
  FileText,
  Phone,
  Mail,
  Home,
  PawPrint,
  MessageSquare,
  X,
} from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { adoptionApplicationApi } from "@/lib/api/adoption";
import type { AdoptionApplication, AdoptionListing } from "@/lib/api/adoption";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const LIVING_LABELS: Record<string, string> = {
  house_with_yard: "House with yard",
  house_without_yard: "House without yard",
  apartment: "Apartment",
  farm: "Farm",
  other: "Other",
};

export default function AdoptionRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(
    null,
  );

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adoptionApplicationApi.getMyApplications();
      if (res.data?.applications) {
        setApplications(res.data.applications);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchApplications();
  }, [user, authLoading, router, fetchApplications]);

  const filteredApps = activeTab
    ? applications.filter((a) => a.status === activeTab)
    : applications;

  const getListing = (app: AdoptionApplication): AdoptionListing | null =>
    typeof app.listingId === "object" ? app.listingId : null;

  const formatAge = (months: number) => {
    if (months < 1) return "< 1 mo";
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} yr${years > 1 ? "s" : ""}`;
    return `${years}y ${rem}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || !user) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                My Applications
              </h1>
              <p className="text-xs text-gray-400">
                {applications.length} total application
                {applications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            {TABS.map((tab) => {
              const count = tab.value
                ? applications.filter((a) => a.status === tab.value).length
                : applications.length;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab.value
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 ${
                        activeTab === tab.value
                          ? "text-white/80"
                          : "text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                {activeTab
                  ? `No ${activeTab} applications`
                  : "No applications yet"}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Browse pets available for adoption
              </p>
              <button
                onClick={() => router.push("/adopt")}
                className="px-6 py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                Browse Pets
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app, index) => {
                const listing = getListing(app);
                const status = STATUS_CONFIG[app.status];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedApp(app)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                  >
                    <div className="flex gap-3 p-3.5">
                      {/* Pet Photo */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {listing?.photos?.[0] ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-teal-50">
                            <PawPrint className="w-6 h-6 text-teal-300" />
                          </div>
                        )}
                        {/* Status dot */}
                        <div
                          className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${status.dot} ring-2 ring-white`}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {listing?.name || "Pet"}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {listing
                                ? `${listing.breed} · ${listing.species}`
                                : ""}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        </div>

                        {/* Status + Date row */}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.color} ${status.border} border`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatDate(app.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review notes banner (if rejected/approved with notes) */}
                    {app.reviewNotes && app.status !== "pending" && (
                      <div
                        className={`px-4 py-2 text-xs border-t ${
                          app.status === "approved"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : "bg-red-50 border-red-100 text-red-600"
                        }`}
                      >
                        <span className="font-medium">Note:</span>{" "}
                        {app.reviewNotes}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Bottom Sheet */}
        <AnimatePresence>
          {selectedApp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
              onClick={() => setSelectedApp(null)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Sheet Header */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Application Details
                  </h2>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="w-full h-px bg-gray-100" />

                {/* Scrollable content */}
                <div
                  className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {(() => {
                    const listing = getListing(selectedApp);
                    const status = STATUS_CONFIG[selectedApp.status];
                    const StatusIcon = status.icon;

                    return (
                      <>
                        {/* Pet card */}
                        {listing && (
                          <div
                            onClick={() => router.push(`/adopt/${listing._id}`)}
                            className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                              {listing.photos?.[0] ? (
                                <img
                                  src={listing.photos[0]}
                                  alt={listing.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-teal-50">
                                  <PawPrint className="w-5 h-5 text-teal-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm">
                                {listing.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {listing.breed} &bull; {listing.species}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatAge(listing.age)}
                                </span>
                                {listing.location && (
                                  <span className="text-xs text-teal-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {listing.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 self-center" />
                          </div>
                        )}

                        {/* Status */}
                        <div
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${status.bg} border ${status.border}`}
                        >
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                          <div>
                            <p
                              className={`text-sm font-semibold ${status.color}`}
                            >
                              {status.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              Applied {formatDate(selectedApp.createdAt)}
                              {selectedApp.reviewedAt &&
                                ` · Reviewed ${formatDate(selectedApp.reviewedAt)}`}
                            </p>
                          </div>
                        </div>

                        {/* Review notes */}
                        {selectedApp.reviewNotes && (
                          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Review Notes
                            </p>
                            <p className="text-sm text-gray-700">
                              {selectedApp.reviewNotes}
                            </p>
                          </div>
                        )}

                        {/* Your message */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Your Message
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 whitespace-pre-line">
                            {selectedApp.message}
                          </p>
                        </div>

                        {/* Contact details */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Contact Details
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-sm text-gray-700">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {selectedApp.contactPhone}
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-gray-700">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {selectedApp.contactEmail}
                            </div>
                          </div>
                        </div>

                        {/* Living situation & flags */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Additional Info
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Home className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Living
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-gray-700">
                                {LIVING_LABELS[selectedApp.livingSituation] ||
                                  selectedApp.livingSituation}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <PawPrint className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Other Pets
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-gray-700">
                                {selectedApp.hasOtherPets ? "Yes" : "No"}
                              </p>
                            </div>
                            {selectedApp.hasOtherPets &&
                              selectedApp.otherPetsDetails && (
                                <div className="col-span-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Pet Details
                                  </p>
                                  <p className="text-xs text-gray-700">
                                    {selectedApp.otherPetsDetails}
                                  </p>
                                </div>
                              )}
                            <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Children
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-gray-700">
                                {selectedApp.hasChildren ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* View listing button */}
                        {listing && (
                          <button
                            onClick={() => router.push(`/adopt/${listing._id}`)}
                            className="w-full py-3 px-4 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Heart className="w-4 h-4" />
                            View Listing
                          </button>
                        )}

                        <div className="h-4" />
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
