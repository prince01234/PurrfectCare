"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/lib/api";
import MobileLayout from "@/components/layout/MobileLayout";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "" });
    }
  }, [user]);

  // Fetch current profile picture
  useEffect(() => {
    if (!user?._id) return;
    
    const fetchProfile = async () => {
      const res = await userApi.getUserById(user._id);
      if (res.data?.profileImage) {
        setProfilePicture(res.data.profileImage);
      }
    };
    fetchProfile();
  }, [user?._id]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
      const result = await userApi.updateUser(user._id, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsLoading(true);
      const result = await userApi.updateUser(user._id, {
        name: formData.name,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      updateUser({
        name: formData.name,
      });
      toast.success("Profile updated successfully");
      router.back();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-8">
          {/* Profile Picture */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 rounded-full border-3 border-white flex items-center justify-center shadow-md transition-colors"
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
            <p className="text-xs text-gray-500 text-center">
              Tap the camera icon to change your photo
            </p>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-2">
              Email cannot be changed. Contact support for assistance.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-sm mb-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>

          {/* Cancel Button */}
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
