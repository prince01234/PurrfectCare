"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/api/admin";
import MobileLayout from "@/components/layout/MobileLayout";

const SERVICE_TYPES = [
  { value: "pet_adoption", label: "Pet Adoption", emoji: "🐾" },
  { value: "veterinary", label: "Veterinary", emoji: "🩺" },
  { value: "grooming", label: "Grooming", emoji: "✂️" },
  { value: "training", label: "Training", emoji: "🎓" },
  { value: "pet_sitting", label: "Pet Sitting", emoji: "🏠" },
  { value: "marketplace", label: "Marketplace", emoji: "🛒" },
  { value: "other", label: "Other", emoji: "📦" },
];

export default function ProviderApplyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    serviceType: "",
    serviceDescription: "",
    contactPhone: "",
    contactAddress: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName.trim())
      newErrors.organizationName = "Organization name is required";
    if (!formData.serviceType)
      newErrors.serviceType = "Please select a service type";
    if (!formData.serviceDescription.trim())
      newErrors.serviceDescription = "Description is required";
    if (formData.serviceDescription.trim().length < 20)
      newErrors.serviceDescription =
        "Description must be at least 20 characters";
    if (!formData.contactPhone.trim())
      newErrors.contactPhone = "Phone number is required";
    if (!formData.contactAddress.trim())
      newErrors.contactAddress = "Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const result = await adminApi.apply(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Application submitted successfully! We'll review it shortly.",
      );
      router.push("/profile");
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              Become a Service Provider
            </h1>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Join Our Network</h2>
              <p className="text-sm text-purple-100">
                Offer your pet services to thousands of pet owners
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mx-4 mt-6 mb-8 space-y-5"
        >
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization / Business Name
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="e.g., Happy Paws Shelter"
              className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400 outline-none transition-all ${
                errors.organizationName
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              }`}
            />
            {errors.organizationName && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.organizationName}
              </p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      serviceType: type.value,
                    }));
                    if (errors.serviceType)
                      setErrors((prev) => ({ ...prev, serviceType: "" }));
                  }}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    formData.serviceType === type.value
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{type.emoji}</span>
                  <p
                    className={`text-sm font-medium mt-1 ${
                      formData.serviceType === type.value
                        ? "text-violet-700"
                        : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
            {errors.serviceType && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.serviceType}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Description
            </label>
            <textarea
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleChange}
              placeholder="Describe your services, experience, and what makes you stand out..."
              rows={4}
              className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400 outline-none resize-none transition-all ${
                errors.serviceDescription
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.serviceDescription ? (
                <p className="text-red-500 text-sm ml-1">
                  {errors.serviceDescription}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">
                {formData.serviceDescription.length}/20 min
              </span>
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+977-9800000000"
              className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400 outline-none transition-all ${
                errors.contactPhone
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              }`}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.contactPhone}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address
            </label>
            <input
              type="text"
              name="contactAddress"
              value={formData.contactAddress}
              onChange={handleChange}
              placeholder="e.g., Kathmandu, Nepal"
              className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400 outline-none transition-all ${
                errors.contactAddress
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              }`}
            />
            {errors.contactAddress && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.contactAddress}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-base bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </motion.form>
      </div>
    </MobileLayout>
  );
}
