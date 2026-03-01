"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  ClipboardList,
  Package,
  Users,
  ArrowUpRight,
  PawPrint,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/api/admin";
import { adoptionApplicationApi } from "@/lib/api/adoption";
import type { AdoptionStatsResponse } from "@/lib/api/adoption";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles === "SUPER_ADMIN";
  const isAdoptionAdmin = user?.serviceType === "pet_adoption" || isSuperAdmin;

  const [providerPending, setProviderPending] = useState(0);
  const [adoptionStats, setAdoptionStats] =
    useState<AdoptionStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises: Promise<unknown>[] = [];

        // Super admin: fetch pending provider application count
        if (isSuperAdmin) {
          promises.push(
            adminApi.getAllApplications({ status: "pending", limit: 1 }),
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        // Adoption admin: fetch adoption stats
        if (isAdoptionAdmin) {
          promises.push(adoptionApplicationApi.getAdoptionStats());
        } else {
          promises.push(Promise.resolve(null));
        }

        const [providerResult, adoptionResult] = await promises;

        setProviderPending(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (providerResult as any)?.data?.pagination?.total || 0,
        );

        if (adoptionResult) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (adoptionResult as any)?.data as AdoptionStatsResponse;
          if (data) setAdoptionStats(data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isSuperAdmin, isAdoptionAdmin]);

  const statCards = [
    ...(isSuperAdmin
      ? [
          {
            label: "Pending Reviews",
            value: providerPending,
            icon: Users,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
        ]
      : []),
    ...(isAdoptionAdmin && adoptionStats
      ? [
          {
            label: "Total Listings",
            value: adoptionStats.listings.total,
            icon: PawPrint,
            color: "text-teal-500",
            bg: "bg-teal-50",
          },
          {
            label: "Available",
            value: adoptionStats.listings.available,
            icon: Heart,
            color: "text-pink-500",
            bg: "bg-pink-50",
          },
          {
            label: "Adopted",
            value: adoptionStats.listings.adopted,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending Apps",
            value: adoptionStats.applications.pending,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
        ]
      : []),
  ];

  const quickActions = [
    ...(isSuperAdmin
      ? [
          {
            label: "Review Provider Applications",
            description: `${providerPending} pending`,
            icon: ClipboardList,
            href: "/admin/applications",
            color: "from-amber-500 to-orange-500",
          },
        ]
      : []),
    ...(isAdoptionAdmin
      ? [
          {
            label: "Manage Listings",
            description: `${adoptionStats?.listings.total || 0} total listings`,
            icon: Heart,
            href: "/admin/adoption",
            color: "from-pink-500 to-rose-500",
          },
          {
            label: "Adoption Requests",
            description: `${adoptionStats?.applications.pending || 0} pending requests`,
            icon: FileText,
            href: "/admin/adoption-requests",
            color: "from-violet-500 to-purple-500",
          },
          {
            label: "Add New Listing",
            description: "Create a new adoption listing",
            icon: PawPrint,
            href: "/admin/adoption/new",
            color: "from-teal-500 to-emerald-500",
          },
        ]
      : []),
    ...(user?.serviceType === "marketplace" || isSuperAdmin
      ? [
          {
            label: "Products",
            description: "Manage your products",
            icon: Package,
            href: "/admin/products",
            color: "from-blue-500 to-indigo-500",
          },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin
              ? "Manage applications and oversee all services"
              : "Manage your services and listings"}
          </p>
        </motion.div>

        {/* Stats Grid */}
        {!isLoading && statCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-3"
          >
            {statCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + index * 0.04 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                  >
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading skeleton for stats */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 mb-2" />
                <div className="h-7 w-12 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded mt-1.5" />
              </div>
            ))}
          </div>
        )}

        {/* Application Status Breakdown */}
        {!isLoading && isAdoptionAdmin && adoptionStats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-3">
              Application Overview
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                  Total: {adoptionStats.applications.total} applications
                </p>
              </div>

              {/* Progress bar */}
              {adoptionStats.applications.total > 0 && (
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex mb-3">
                  <div
                    className="bg-emerald-400 transition-all"
                    style={{
                      width: `${(adoptionStats.applications.approved / adoptionStats.applications.total) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{
                      width: `${(adoptionStats.applications.pending / adoptionStats.applications.total) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-400 transition-all"
                    style={{
                      width: `${(adoptionStats.applications.rejected / adoptionStats.applications.total) * 100}%`,
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-600">
                    {adoptionStats.applications.approved} Approved
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-600">
                    {adoptionStats.applications.pending} Pending
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs text-gray-600">
                    {adoptionStats.applications.rejected} Rejected
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href + index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.04 }}
            >
              <Link href={action.href}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-linear-to-br ${action.color} flex items-center justify-center`}
                    >
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            </motion.div>
          ))}

          {quickActions.length === 0 && !isLoading && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">
                No services configured yet. Contact support if this seems wrong.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
