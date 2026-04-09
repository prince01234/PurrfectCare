"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Settings,
  Trash2,
  Key,
  ChevronRight,
  User as UserIcon,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      const res = await userApi.deleteUser(user._id);

      if (res.error) {
        toast.error(res.error || "Failed to delete account");
        setShowConfirmDelete(false);
        setIsDeleting(false);
        return;
      }

      toast.success("Account deleted successfully");
      logout();
      router.push("/register");
    } catch (err) {
      toast.error("An error occurred while deleting account");
      console.error(err);
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex justify-center items-center h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return null; // The auth context redirect should handle this
  }

  const menuOptions = [
    {
      id: "edit",
      label: "Edit Profile",
      icon: UserIcon,
      onClick: () => router.push("/profile/edit"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "password",
      label: "Change Password",
      icon: Key,
      onClick: () => router.push("/profile/change-password"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-slate-50 relative">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 px-5 py-4 max-w-lg mx-auto">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Manage Account</h1>
          </div>
        </div>

        <div className="px-5 py-6 max-w-lg mx-auto">
          {/* Account Details card */}
          <div className="mb-6 bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-center">
            <div className="w-16 h-16 mx-auto bg-teal-50 rounded-full flex items-center justify-center mb-3">
              <Settings className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>

          {/* Links */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-gray-100 mb-8">
            {menuOptions.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bgColor}`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 font-semibold text-gray-900">
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 px-2">
              Danger Zone
            </h3>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center gap-4 bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <span className="flex-1 font-semibold text-red-600 text-left">
                Delete Account
              </span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showConfirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl"
              >
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5 mx-auto">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Delete Account?
                </h3>
                <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to permanently delete your account? This
                  action cannot be undone and all your data, pets, and order
                  history will be lost forever.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center"
                  >
                    {isDeleting ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
