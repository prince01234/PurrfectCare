"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  User,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/api/admin";
import type { AdminApplication } from "@/lib/api/admin";
import AdminLayout from "@/components/layout/AdminLayout";

export default function ApplicationDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<AdminApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.roles !== "SUPER_ADMIN") {
      router.push("/admin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        // We fetch all applications and find the one matching the ID
        // since the backend doesn't have a single-application endpoint for super admin
        const result = await adminApi.getAllApplications({ limit: 100 });
        if (result.data?.applications) {
          const found = result.data.applications.find(
            (a) => a._id === applicationId,
          );
          if (found) {
            setApplication(found);
          }
        }
      } catch (err) {
        console.error("Fetch application error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.roles === "SUPER_ADMIN" && applicationId) {
      fetchApplication();
    }
  }, [user?.roles, applicationId]);

  const handleApprove = async () => {
    try {
      setIsActioning(true);
      const result = await adminApi.approveApplication(
        applicationId,
        reviewNotes || undefined,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application approved!");
      router.push("/admin/applications");
    } catch {
      toast.error("Failed to approve application");
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setIsActioning(true);
      const result = await adminApi.rejectApplication(
        applicationId,
        rejectionReason,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application rejected");
      router.push("/admin/applications");
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!application) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Application not found</p>
          <button
            onClick={() => router.push("/admin/applications")}
            className="mt-4 text-teal-600 font-medium text-sm"
          >
            Back to applications
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isPending = application.status === "pending";

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Back link */}
        <button
          onClick={() => router.push("/admin/applications")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to applications
        </button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {application.organizationName}
              </h2>
              <span className="inline-block mt-1 text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">
                {application.serviceType
                  .replace("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                application.status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : application.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {application.status === "pending" && (
                <Clock className="w-3 h-3" />
              )}
              {application.status === "approved" && (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {application.status === "rejected" && (
                <XCircle className="w-3 h-3" />
              )}
              {application.status.charAt(0).toUpperCase() +
                application.status.slice(1)}
            </span>
          </div>

          {/* Applicant Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>
                {typeof application.userId === "object"
                  ? application.userId.name
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>
                {typeof application.userId === "object"
                  ? application.userId.email
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{application.contactPhone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{application.contactAddress}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="flex-1">{application.serviceDescription}</p>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-xs pt-2 border-t border-gray-100">
              <Clock className="w-3.5 h-3.5" />
              <span>Applied {formatDate(application.createdAt)}</span>
            </div>
          </div>
        </motion.div>

        {/* Review notes or rejection reason (for already-reviewed apps) */}
        {application.status === "approved" && application.reviewNotes && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-green-800 mb-1">
              Review Notes
            </p>
            <p className="text-sm text-green-700">{application.reviewNotes}</p>
          </div>
        )}
        {application.status === "rejected" && application.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-red-800 mb-1">
              Rejection Reason
            </p>
            <p className="text-sm text-red-700">
              {application.rejectionReason}
            </p>
          </div>
        )}

        {/* Action Buttons (only for pending) */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Optional review notes for approval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none text-sm transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isActioning}
                className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isActioning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={isActioning}
                className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>

            {/* Rejection form */}
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (required)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-200 bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none text-sm transition-all"
                />
                <button
                  onClick={handleReject}
                  disabled={isActioning || !rejectionReason.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActioning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
