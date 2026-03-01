"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Camera,
  Edit2,
  LogOut,
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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { petApi, orderApi, userApi, adminApi } from "@/lib/api";
import type { Pet } from "@/lib/api";
import type { AdminApplication } from "@/lib/api/admin";
import MobileLayout from "@/components/layout/MobileLayout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser, isLoading: authLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [application, setApplication] = useState<AdminApplication | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch pets, orders, and user profile
  // Use user._id as dependency to avoid infinite re-render loop
  // (updateUser creates a new object ref which would re-trigger [user])
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        const [petsRes, ordersRes, userRes] = await Promise.all([
          petApi.getPets({ limit: 100 }),
          orderApi.getOrders({ limit: 1 }),
          userApi.getUserById(user._id),
        ]);

        if (petsRes.data?.pets) setPets(petsRes.data.pets);
        if (ordersRes.data?.pagination)
          setOrderCount(ordersRes.data.pagination.total);
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

  if (authLoading || !user) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  const menuItems = [
    {
      label: "My Orders",
      icon: Package,
      href: "/marketplace/orders",
      badge: orderCount > 0 ? orderCount : null,
    },
    {
      label: "Adoption Requests",
      icon: Heart,
      href: "/adoption-requests",
      badge: null,
    },
    {
      label: "Payment Methods",
      icon: CreditCard,
      href: "/payment-methods",
      badge: null,
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
      badge: null,
    },
    {
      label: "Help & Support",
      icon: HelpCircle,
      href: "/help-support",
      badge: null,
    },
  ];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Teal top bar */}
        <div className="h-1.5 bg-teal-500" />

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex flex-col items-center pt-10 pb-8 px-4">
            {/* Avatar with upload */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-colors"
              >
                {isUploadingPicture ? (
                  <Loader className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
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

            {/* Name + email */}
            <div className="flex items-center gap-1.5 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <button
                onClick={() => router.push("/profile/edit")}
                className="text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-2">{user.email}</p>
          </div>

          {/* Stats row */}
          <div className="border-t border-gray-100">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <Link
                href="/pets"
                className="py-5 text-center hover:bg-gray-50 transition-colors"
              >
                <p className="text-xl font-bold text-gray-900">{pets.length}</p>
                <p className="text-xs text-gray-500 mt-1">Pets</p>
              </Link>
              <div className="py-5 text-center">
                <p className="text-xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Reviews</p>
              </div>
              <div className="py-5 text-center">
                <p className="text-xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Bookings</p>
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
          <h3 className="text-base font-bold text-gray-900 mb-4">My Pets</h3>

          <div className="flex gap-5 overflow-x-auto pb-2">
            {pets.slice(0, 5).map((pet) => (
              <Link
                key={pet._id}
                href={`/pets/${pet._id}`}
                className="shrink-0 text-center"
              >
                <div className="w-18 h-18 rounded-2xl bg-gray-200 overflow-hidden shadow-sm">
                  {pet.photos?.[0] ? (
                    <img
                      src={pet.photos[0]}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-teal-100 to-teal-300 flex items-center justify-center text-2xl">
                      🐾
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 mt-2 truncate max-w-18">
                  {pet.name}
                </p>
              </Link>
            ))}

            {/* Add pet */}
            <Link href="/pets/add" className="shrink-0 text-center">
              <div className="w-18 h-18 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-teal-400 transition-colors">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-700 mt-2">Add Pet</p>
            </Link>
          </div>
        </motion.div>

        {/* ── Service Provider Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-4 mt-8"
        >
          {user.roles === "ADMIN" || user.roles === "SUPER_ADMIN" ? (
            // Already an admin — show portal link
            <Link href="/admin">
              <div className="bg-linear-to-r from-teal-500 to-teal-600 rounded-2xl px-5 py-5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-white block">
                      {user.roles === "SUPER_ADMIN"
                        ? "Super Admin Portal"
                        : "Service Provider Portal"}
                    </span>
                    <span className="text-xs text-teal-100">
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-5 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-amber-800">
                  Application Pending
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Your service provider application is under review
                </p>
              </div>
            </div>
          ) : application?.status === "rejected" ? (
            // Application rejected
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-red-800">
                    Application Rejected
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {application.rejectionReason ||
                      "Your application was not approved"}
                  </p>
                </div>
              </div>
              <Link href="/provider/apply">
                <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-center gap-2 shadow-sm border border-gray-200 active:bg-gray-50">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-semibold text-teal-600">
                    Apply Again
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            // No application yet — show CTA
            <Link href="/provider/apply">
              <div className="bg-linear-to-r from-violet-500 to-purple-600 rounded-2xl px-5 py-6 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">
                      Become a Service Provider
                    </p>
                    <p className="text-xs text-purple-100 mt-1">
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
          className="mx-4 mt-10 space-y-4"
        >
          {menuItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between shadow-sm active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-base font-semibold text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== null && (
                    <span className="min-w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-2">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 rounded-2xl px-5 py-5 flex items-center gap-3.5 active:bg-red-100 transition-colors mt-8"
          >
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-base font-semibold text-red-600">
              Log Out
            </span>
          </button>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
