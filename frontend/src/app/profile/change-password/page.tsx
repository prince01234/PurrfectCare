"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader, Lock } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import MobileLayout from "@/components/layout/MobileLayout";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (authLoading || !user) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword,
      );

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Password changed successfully");
      router.push("/profile");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Change Password</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-sm mb-3"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            ) : (
              "Update Password"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3.5 rounded-xl font-semibold transition-colors border border-gray-200"
          >
            Cancel
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}
