"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/api/admin";
import type { AdminApplication } from "@/lib/api/admin";
import AdminLayout from "@/components/layout/AdminLayout";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; icon: React.ElementType }
> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  approved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function AdminApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    if (!authLoading && user?.roles !== "SUPER_ADMIN") {
      router.push("/admin");
    }
  }, [authLoading, user, router]);

  const fetchApplications = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const result = await adminApi.getAllApplications({
          page,
          limit: 10,
          ...(statusFilter ? { status: statusFilter } : {}),
        });

        if (result.data) {
          setApplications(result.data.applications || []);
          setPagination(
            result.data.pagination || { total: 0, page: 1, totalPages: 1 },
          );
        }
      } catch (err) {
        console.error("Fetch applications error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (user?.roles === "SUPER_ADMIN") {
      fetchApplications(1);
    }
  }, [user?.roles, fetchApplications]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Provider Applications
          </h2>
          <span className="text-sm text-gray-500">
            {pagination.total} total
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? "bg-teal-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, index) => {
              const style = STATUS_STYLES[app.status];
              const StatusIcon = style?.icon || Clock;

              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/admin/applications/${app._id}`}>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {app.organizationName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style?.bg} ${style?.text}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {typeof app.userId === "object"
                              ? `${app.userId.name} • ${app.userId.email}`
                              : "Unknown user"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                              {app.serviceType
                                .replace("_", " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(app.createdAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
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
    </AdminLayout>
  );
}
