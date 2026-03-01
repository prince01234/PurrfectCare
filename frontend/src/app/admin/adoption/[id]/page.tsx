"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { adoptionListingApi, adoptionApplicationApi } from "@/lib/api/adoption";
import type { AdoptionListing, AdoptionApplication } from "@/lib/api/adoption";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminAdoptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<AdoptionListing | null>(null);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, appsRes] = await Promise.all([
          adoptionListingApi.getListingById(listingId),
          adoptionApplicationApi.getApplicationsByListing(listingId),
        ]);

        if (listingRes.data) setListing(listingRes.data);
        if (appsRes.data?.applications)
          setApplications(appsRes.data.applications);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [listingId]);

  const handleApprove = async (appId: string) => {
    try {
      setActioningId(appId);
      const result = await adoptionApplicationApi.approveApplication(appId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application approved! Listing marked as adopted.");
      // Refresh data
      const [listingRes, appsRes] = await Promise.all([
        adoptionListingApi.getListingById(listingId),
        adoptionApplicationApi.getApplicationsByListing(listingId),
      ]);
      if (listingRes.data) setListing(listingRes.data);
      if (appsRes.data?.applications)
        setApplications(appsRes.data.applications);
    } catch {
      toast.error("Failed to approve application");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      setActioningId(appId);
      const result = await adoptionApplicationApi.rejectApplication(appId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application rejected");
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId ? { ...a, status: "rejected" as const } : a,
        ),
      );
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    if (!confirm(`Are you sure you want to delete "${listing.name}"?`)) return;
    const result = await adoptionListingApi.deleteListing(listing._id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing deleted");
    router.push("/admin/adoption");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!listing) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Listing not found</p>
        </div>
      </AdminLayout>
    );
  }

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <AdminLayout>
      <div className="space-y-4">
        <button
          onClick={() => router.push("/admin/adoption")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>

        {/* Listing Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Photos */}
          {listing.photos?.length > 0 && (
            <div className="relative">
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={listing.photos[activePhoto]}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {listing.photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {listing.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activePhoto ? "bg-white w-4" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {listing.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {listing.species} • {listing.breed} • {listing.gender} •{" "}
                  {listing.age} months
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  listing.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {listing.status}
              </span>
            </div>

            {listing.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </div>
            )}

            <p className="text-sm text-gray-700 mb-3">{listing.description}</p>

            {listing.healthInfo && (
              <div className="text-sm mb-2">
                <span className="font-medium text-gray-700">Health: </span>
                <span className="text-gray-600">{listing.healthInfo}</span>
              </div>
            )}
            {listing.temperament && (
              <div className="text-sm mb-2">
                <span className="font-medium text-gray-700">Temperament: </span>
                <span className="text-gray-600">{listing.temperament}</span>
              </div>
            )}
            {listing.specialNeeds && (
              <div className="text-sm mb-2">
                <span className="font-medium text-gray-700">
                  Special Needs:{" "}
                </span>
                <span className="text-gray-600">{listing.specialNeeds}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              {listing.status === "available" && (
                <Link
                  href={`/admin/adoption/${listing._id}/edit`}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Link>
              )}
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </motion.div>

        {/* Applications Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">
            Applications ({applications.length})
            {pendingApps.length > 0 && (
              <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {pendingApps.length} pending
              </span>
            )}
          </h3>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">No applications yet</p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {typeof app.applicantId === "object"
                        ? app.applicantId.name
                        : "Unknown"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {typeof app.applicantId === "object"
                        ? app.applicantId.email
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      app.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : app.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {app.message}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {app.contactPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {app.contactEmail}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                    {app.livingSituation?.replace("_", " ")}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                    {app.hasOtherPets ? "Has other pets" : "No other pets"}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                    {app.hasChildren ? "Has children" : "No children"}
                  </span>
                </div>

                {/* Action buttons for pending applications */}
                {app.status === "pending" && listing.status === "available" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(app._id)}
                      disabled={actioningId === app._id}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {actioningId === app._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(app._id)}
                      disabled={actioningId === app._id}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
