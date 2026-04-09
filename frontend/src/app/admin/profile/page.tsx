"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Tag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { serviceProviderApi } from "@/lib/api/service";
import type {
  AvailabilitySlot,
  CreateProviderData,
  ServiceProvider,
} from "@/lib/api/service";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = DAY_ORDER.map((day) => ({
  day,
  startTime: "09:00",
  endTime: "17:00",
  isAvailable: !["saturday", "sunday"].includes(day),
}));

export default function AdminProfilePage() {
  const { user } = useAuth();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [availability, setAvailability] =
    useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );

  const isPetSitting = user?.serviceType === "pet_sitting";

  const hydrateFromProvider = (data: ServiceProvider) => {
    setProvider(data);
    setName(data.name || user?.organizationName || user?.name || "");
    setDescription(data.description || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setSlotDuration(data.slotDuration || 30);
    setAmenities(data.amenities || []);
    setCoverImagePreview(data.coverImage || null);

    const mergedAvailability = DAY_ORDER.map((day) => {
      const existing = data.availability.find((a) => a.day === day);
      return (
        existing || {
          day,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        }
      );
    });
    setAvailability(mergedAvailability);
  };

  useEffect(() => {
    if (user && !name) {
      setName(user.organizationName || user.name || "");
    }
  }, [user, name]);

  useEffect(() => {
    const fetchProvider = async () => {
      setIsLoading(true);
      const res = await serviceProviderApi.getMyProvider();
      if (res.data) {
        hydrateFromProvider(res.data);
      }
      setIsLoading(false);
    };

    fetchProvider();
  }, []);

  const stripAvailabilityIds = (slots: AvailabilitySlot[]) =>
    slots.map((slot) => {
      const cloned = { ...slot };
      delete cloned._id;
      return cloned;
    });

  const buildPayload = (): CreateProviderData => ({
    name: name.trim(),
    description: description.trim() || undefined,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
    address: address.trim() || undefined,
    amenities: amenities.length ? amenities : undefined,
    slotDuration,
    availability: stripAvailabilityIds(availability),
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Organization name is missing. Update your profile first.");
      return;
    }

    setIsCreating(true);
    const payload = buildPayload();
    const res = await serviceProviderApi.createProvider(
      payload,
      null,
      coverImageFile,
    );

    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success("Service profile created");
      hydrateFromProvider(res.data);
      setCoverImageFile(null);
    }

    setIsCreating(false);
  };

  const handleUpdate = async () => {
    if (!provider) return;

    setIsSaving(true);
    const payload = buildPayload();
    const res = await serviceProviderApi.updateProvider(
      payload,
      null,
      coverImageFile,
    );

    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success("Service profile updated");
      hydrateFromProvider(res.data);
      setCoverImageFile(null);
    }

    setIsSaving(false);
  };

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, isAvailable: !slot.isAvailable } : slot,
      ),
    );
  };

  const updateAvailabilityTime = (
    day: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const addAmenity = () => {
    const value = newAmenity.trim();
    if (!value) return;

    const exists = amenities.some(
      (amenity) => amenity.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      toast.error("Amenity already added");
      return;
    }

    setAmenities((prev) => [...prev, value]);
    setNewAmenity("");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-6 w-56 rounded bg-gray-200 animate-pulse" />
          <div className="rounded-2xl bg-white border border-gray-100 p-5 space-y-3 animate-pulse">
            <div className="h-10 rounded-xl bg-gray-100" />
            <div className="h-20 rounded-xl bg-gray-100" />
            <div className="h-10 rounded-xl bg-gray-100" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900">
            Service Profile Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business details, availability, and public profile
          </p>
        </motion.div>

        {provider ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Your service profile is active
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Complete your profile before managing service packages
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Service Name
            </label>
            <input
              value={name}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-700"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Name comes from your organization profile
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your service..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your business address"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>

          {!isPetSitting && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Appointment Slot Duration (minutes)
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-teal-500" />
            Cover Image
          </h3>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50">
            {coverImagePreview || coverImageFile ? (
              <>
                <Image
                  src={
                    coverImageFile
                      ? URL.createObjectURL(coverImageFile)
                      : coverImagePreview!
                  }
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImageFile(null);
                    setCoverImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 border border-gray-200"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                <ImagePlus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1.5">
                  Upload cover image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCoverImageFile(file);
                  }}
                />
              </label>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900">
            Facility Amenities
          </h3>

          <div className="flex gap-2">
            <input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAmenity();
                }
              }}
              placeholder="e.g. Parking, WiFi, AC"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-3 py-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() =>
                      setAmenities((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Add amenities customers can expect at your facility
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Availability Schedule
          </h3>

          <div className="space-y-2">
            {availability.map((slot) => (
              <div
                key={slot.day}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  slot.isAvailable ? "bg-emerald-50" : "bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(slot.day)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    slot.isAvailable
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {slot.isAvailable && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </button>

                <span
                  className={`text-sm font-medium w-24 ${
                    slot.isAvailable ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {DAY_LABELS[slot.day]}
                </span>

                {slot.isAvailable && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateAvailabilityTime(
                          slot.day,
                          "startTime",
                          e.target.value,
                        )
                      }
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-teal-400 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateAvailabilityTime(
                          slot.day,
                          "endTime",
                          e.target.value,
                        )
                      }
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <Link
            href="/admin/services"
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-800">
                Manage Service Options / Packages
              </span>
            </div>
            <span className="text-xs text-gray-400">Open</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {provider ? (
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5" />
              )}
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Plus className="w-4.5 h-4.5" />
              )}
              {isCreating ? "Creating..." : "Create Service Profile"}
            </button>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
