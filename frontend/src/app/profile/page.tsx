"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Camera,
  Edit2,
  LogOut,
  Lock,
  Package,
  Heart,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  Plus,
  Loader,
  ShieldCheck,
  Briefcase,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  Mail,
  User,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { petApi, orderApi, userApi, adminApi, authApi } from "@/lib/api";
import type { Pet } from "@/lib/api";
import type { AdminApplication } from "@/lib/api/admin";
import MobileLayout from "@/components/layout/MobileLayout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser, isLoading: authLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [application, setApplication] = useState<AdminApplication | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch pets, orders, and user profile
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        const [petsRes, pendingOrdersRes, userRes] = await Promise.all([
          petApi.getPets({ limit: 100 }),
          orderApi.getOrders({ limit: 50, status: "pending" }),
          userApi.getUserById(user._id),
        ]);

        if (petsRes.data?.pets) setPets(petsRes.data.pets);
        if (pendingOrdersRes.data?.orders) {
          // Count only orders that need payment (pending status)
          setPendingOrderCount(pendingOrdersRes.data.orders.length);
        }
        if (userRes.data?.profileImage)
          setProfilePicture(userRes.data.profileImage);

        // Sync roles/serviceType from backend into context (only if changed)
        const backendRoles = (userRes.data as Record<string, unknown>)
          ?.roles as string | undefined;
        const backendServiceType = (userRes.data as Record<string, unknown>)
          ?.serviceType as string | undefined;
        if (
          backendRoles &&
          (backendRoles !== user.roles ||
            backendServiceType !== user.serviceType)
        ) {
          updateUser({
            roles: backendRoles as
              | "USER"
              | "PET_OWNER"
              | "ADMIN"
              | "SUPER_ADMIN",
            serviceType: backendServiceType,
          });
        }

        // Fetch admin application status (non-admin users)
        if (
          !backendRoles ||
          backendRoles === "USER" ||
          backendRoles === "PET_OWNER"
        ) {
          const appRes = await adminApi.getMyApplication();
          if (appRes.data) setApplication(appRes.data as AdminApplication);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setIsUploadingPicture(true);
      const result = await userApi.updateUser(user!._id, {
        profilePicture: file,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setProfilePicture(preview);
      };
      reader.readAsDataURL(file);

      toast.success("Profile picture updated successfully");
    } catch (err) {
      toast.error("Failed to upload profile picture");
      console.error("Upload error:", err);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error("Email not found. Please login again.");
      return;
    }

    try {
      setIsResendingVerification(true);
      const response = await authApi.resendVerification(user.email);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      toast.success("Verification email sent. Check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email");
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-50 pb-24">
          <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
              <User className="w-8 h-8 text-teal-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-500 mt-2">
              You are browsing as guest.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to manage pets, bookings, orders, and account settings.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const menuItems = [
    {
      label: "My Bookings",
      icon: Calendar,
      href: "/bookings",
      badge: null,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: "My Orders",
      icon: Package,
      href: "/marketplace/orders",
      badge: pendingOrderCount > 0 ? pendingOrderCount : null,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Adoption Requests",
      icon: Heart,
      href: "/adoption-requests",
      badge: null,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
    {
      label: "Payment Methods",
      icon: CreditCard,
      href: "/payment-methods",
      badge: null,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
      badge: null,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Help & Support",
      icon: HelpCircle,
      href: "/help-support",
      badge: null,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
  ];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="h-1 bg-linear-to-br from-teal-500 to-emerald-500" />
        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="relative">
            {/* Cover - subtle gradient */}
            <div className="h-20 bg-linear-to-br from-gray-100 via-gray-50 to-white" />

            {/* Avatar */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt={user.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-3xl font-bold text-slate-600">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPicture}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 rounded-full border-3 border-white flex items-center justify-center shadow-md transition-colors"
                >
                  {isUploadingPicture ? (
                    <Loader className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-14 pb-6 px-5 text-center">
            {/* Name - centered with edit button positioned absolutely */}
            <div className="relative mb-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <button
                onClick={() => router.push("/profile/edit")}
                className="absolute top-1/2 -translate-y-1/2 -right-1 sm:right-auto sm:left-[calc(50%+60px)] p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
                aria-label="Edit profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-gray-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-sm">{user.email}</span>
            </div>

            {!user.isVerified && (
              <div className="mt-4 mx-4 sm:mx-auto sm:max-w-sm">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-amber-800">
                      Email not verified
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Verify to unlock all features
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        router.push(
                          `/verify-email?email=${encodeURIComponent(user.email)}`,
                        )
                      }
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                    >
                      Verify
                    </button>
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="text-xs px-2 py-1.5 text-amber-700 hover:text-amber-800 font-medium disabled:opacity-60 transition-colors"
                    >
                      {isResendingVerification ? "..." : "Resend"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {user.latitude && user.longitude && (
              <div className="flex items-center justify-center gap-1.5 text-gray-400 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs">Location enabled</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="pt-4">
            <div className="grid grid-cols-3 gap-2 px-2">
              <Link
                href="/pets"
                className="py-4 text-center hover:bg-gray-50 rounded-xl transition-colors"
              >
                <p className="text-xl font-bold text-gray-700">{pets.length}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Pets</p>
              </Link>
              <div className="py-4 text-center">
                <p className="text-xl font-bold text-gray-700">0</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  Reviews
                </p>
              </div>
              <div className="py-4 text-center">
                <p className="text-xl font-bold text-gray-700">0</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  Bookings
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── My Pets ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">My Pets</h3>
            <Link
              href="/pets"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View all
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {pets.slice(0, 5).map((pet) => (
              <Link
                key={pet._id}
                href={`/pets/${pet._id}`}
                className="shrink-0 text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shadow-sm ring-2 ring-transparent group-hover:ring-gray-300 transition-all">
                  {pet.photos?.[0] ? (
                    <Image
                      src={pet.photos[0]}
                      alt={pet.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center text-xl">
                      🐾
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 mt-2 truncate max-w-16">
                  {pet.name}
                </p>
              </Link>
            ))}

            {/* Add pet */}
            <Link href="/pets/add" className="shrink-0 text-center group">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-all">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2 group-hover:text-gray-700">
                Add Pet
              </p>
            </Link>
          </div>
        </motion.div>

        {/* ── Service Provider Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-4 mt-8"
        >
          {user.roles === "ADMIN" || user.roles === "SUPER_ADMIN" ? (
            // Already an admin — show portal link
            <Link href="/admin">
              <div className="bg-linear-to-r from-slate-700 to-slate-800 rounded-2xl px-5 py-5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-white block">
                      {user.roles === "SUPER_ADMIN"
                        ? "Super Admin Portal"
                        : "Service Provider Portal"}
                    </span>
                    <span className="text-sm text-slate-300">
                      {user.serviceType
                        ? user.serviceType
                            .replace("_", " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : "Manage your services"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </div>
            </Link>
          ) : application?.status === "pending" ? (
            // Application pending
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-amber-800">
                  Application Pending
                </p>
                <p className="text-sm text-amber-600 mt-0.5">
                  Your service provider application is under review
                </p>
              </div>
            </div>
          ) : application?.status === "rejected" ? (
            // Application rejected
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-red-800">
                    Application Rejected
                  </p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {application.rejectionReason ||
                      "Your application was not approved"}
                  </p>
                </div>
              </div>
              <Link href="/provider/apply">
                <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-center gap-2 shadow-sm border border-gray-200 active:bg-gray-50">
                  <Briefcase className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-bold text-gray-700">
                    Apply Again
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            // No application yet — show CTA
            <Link href="/provider/apply">
              <div className="bg-linear-to-r from-violet-500 to-purple-600 rounded-2xl px-5 py-5 shadow-lg shadow-violet-200/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">
                      Become a Service Provider
                    </p>
                    <p className="text-sm text-purple-100 mt-0.5">
                      Offer adoption, grooming, vet, or training services
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </Link>
          )}
        </motion.div>

        {/* ── Menu List ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mt-8"
        >
          <h3 className="text-base font-bold text-gray-900 mb-4">Account</h3>

          <div className="space-y-3">
            {menuItems.map((item) => (
              <Link key={item.label} href={item.href} className="block">
                <div className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center`}
                    >
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge !== null && (
                      <span className="min-w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full px-1.5">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Log Out - with visual separation */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-2xl px-4 py-4 flex items-center justify-center gap-3 border border-gray-200 hover:border-red-200 hover:bg-red-50/50 active:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-600">
                Log Out
              </span>
            </button>
          </div>
        </motion.div>

        {/* Version info */}
        <p className="text-center text-xs text-gray-400 mt-8 mb-4">
          PurrfectCare v1.0.0
        </p>
      </div>
    </MobileLayout>
  );
}
