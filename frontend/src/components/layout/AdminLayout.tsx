"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Heart,
  Package,
  ArrowLeft,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = user?.roles === "ADMIN" || user?.roles === "SUPER_ADMIN";
  const isSuperAdmin = user?.roles === "SUPER_ADMIN";

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/profile");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
      </div>
    );
  }

  // Build nav items based on role
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    ...(isSuperAdmin
      ? [
          {
            label: "Applications",
            icon: ClipboardList,
            href: "/admin/applications",
          },
        ]
      : []),
    ...(user?.serviceType === "pet_adoption" || isSuperAdmin
      ? [
          { label: "Adoption", icon: Heart, href: "/admin/adoption" },
          {
            label: "Requests",
            icon: FileText,
            href: "/admin/adoption-requests",
          },
        ]
      : []),
    ...(user?.serviceType === "marketplace" || isSuperAdmin
      ? [{ label: "Products", icon: Package, href: "/admin/products" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-bold text-gray-800">
                {isSuperAdmin ? "Admin Portal" : "Service Portal"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
              {user?.serviceType
                ? user.serviceType
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : isSuperAdmin
                  ? "Super Admin"
                  : "Admin"}
            </span>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="px-4 flex gap-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
