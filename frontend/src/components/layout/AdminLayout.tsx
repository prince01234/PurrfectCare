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
  MessageCircle,
  CalendarCheck,
  Settings,
  BarChart3,
  ShoppingBag,
  Bell,
  LogOut,
  User,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationCenterContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, openSheet } = useNotifications();

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

  const isBookableService = [
    "veterinary",
    "grooming",
    "training",
    "pet_sitting",
    "other",
  ].includes(user?.serviceType || "");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const serviceTypeLabel = user?.serviceType
    ? user.serviceType
        .replace("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : isSuperAdmin
      ? "Super Admin"
      : "Admin";

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
          {
            label: "Analytics",
            icon: BarChart3,
            href: "/admin/analytics",
          },
        ]
      : []),
    ...(user?.serviceType === "pet_adoption"
      ? [
          { label: "Adoption", icon: Heart, href: "/admin/adoption" },
          {
            label: "Requests",
            icon: FileText,
            href: "/admin/adoption-requests",
          },
        ]
      : []),
    ...(user?.serviceType === "marketplace"
      ? [{ label: "Products", icon: Package, href: "/admin/products" }]
      : []),
    ...(user?.serviceType === "marketplace"
      ? [
          {
            label: "Orders",
            icon: ShoppingBag,
            href: "/admin/orders",
          },
          {
            label: "Analytics",
            icon: BarChart3,
            href: "/admin/marketplace-analytics",
          },
        ]
      : []),
    ...(isBookableService
      ? [
          { label: "Services", icon: Settings, href: "/admin/services" },
          {
            label: "Bookings",
            icon: CalendarCheck,
            href: "/admin/bookings",
          },
          ...(user?.serviceType === "veterinary"
            ? [
                {
                  label: "Vet Records",
                  icon: HeartPulse,
                  href: "/admin/vet-records",
                },
              ]
            : []),
          {
            label: "Analytics",
            icon: BarChart3,
            href: "/provider/analytics",
          },
        ]
      : []),
    { label: "Messages", icon: MessageCircle, href: "/admin/messages" },
    { label: "Profile", icon: User, href: "/admin/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto pb-20">
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
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h1 className="text-lg font-bold text-gray-800">
                  {isSuperAdmin ? "Admin Portal" : "Service Portal"}
                </h1>
              </div>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                {serviceTypeLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSheet}
              className="relative rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto">
          <div
            className="grid items-stretch gap-1 px-1.5 py-1.5"
            style={{
              gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
            }}
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? "text-teal-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                      isActive ? "bg-teal-50" : ""
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${isActive ? "text-teal-600" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-[9px] leading-tight truncate max-w-full ${
                      isActive ? "font-semibold text-teal-600" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Safe area for devices with home indicator */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
}
