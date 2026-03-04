"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Save,
  Loader2,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  ImagePlus,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { serviceProviderApi } from "@/lib/api/service";
import type {
  ServiceProvider,
  AvailabilitySlot,
  ServiceOption,
  CreateProviderData,
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

export default function AdminServicesPage() {
  const { user } = useAuth();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [availability, setAvailability] =
    useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  // Images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );

  // Amenities
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  const populateForm = (p: ServiceProvider) => {
    setName(p.name || "");
    setDescription(p.description || "");
    setPhone(p.phone || "");
    setEmail(p.email || "");
    setAddress(p.address || "");
    setSlotDuration(p.slotDuration || 30);

    // Merge provider availability with all days
    const merged = DAY_ORDER.map((day) => {
      const existing = p.availability.find((a) => a.day === day);
      return (
        existing || {
          day,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        }
      );
    });
    setAvailability(merged);
    setServiceOptions(
      p.serviceOptions.map((o) => ({
        ...o,
        description: o.description || "",
      })),
    );
    setAmenities(p.amenities || []);
    setImagePreview(p.image || null);
    setCoverImagePreview(p.coverImage || null);
  };

  useEffect(() => {
    const fetchProvider = async () => {
      setIsLoading(true);
      const res = await serviceProviderApi.getMyProvider();
      if (res.data) {
        setProvider(res.data);
        populateForm(res.data);
      }
      setIsLoading(false);
    };
    fetchProvider();
  }, []);

  // Strip _id from availability/serviceOptions before sending to API
  const stripIds = <T extends { _id?: string }>(items: T[]) =>
    items.map((item) => {
      const copy = { ...item };
      delete copy._id;
      return copy;
    });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a service name");
      return;
    }

    setIsCreating(true);
    const data: CreateProviderData = {
      name: name.trim(),
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
      slotDuration,
      availability: stripIds(availability),
      serviceOptions: stripIds(serviceOptions),
    };

    const res = await serviceProviderApi.createProvider(
      data,
      imageFile,
      coverImageFile,
    );
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Service profile created!");
      setProvider(res.data!);
    }
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const data: Partial<CreateProviderData> = {
      name: name.trim(),
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      amenities,
      slotDuration,
      availability: stripIds(availability),
      serviceOptions: stripIds(serviceOptions),
    };

    const res = await serviceProviderApi.updateProvider(
      data,
      imageFile,
      coverImageFile,
    );
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Service profile updated!");
      setProvider(res.data!);
    }
    setIsSaving(false);
  };

  // Availability helpers
  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.map((a) =>
        a.day === day ? { ...a, isAvailable: !a.isAvailable } : a,
      ),
    );
  };

  const updateAvailTime = (
    day: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setAvailability((prev) =>
      prev.map((a) => (a.day === day ? { ...a, [field]: value } : a)),
    );
  };

  // Service options helpers
  const addServiceOption = () => {
    setServiceOptions((prev) => [
      ...prev,
      { name: "", description: "", price: null, duration: null },
    ]);
  };

  const updateServiceOption = (
    index: number,
    field: keyof ServiceOption,
    value: string | number | null,
  ) => {
    setServiceOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  };

  const removeServiceOption = (index: number) => {
    setServiceOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Service option image upload
  const [uploadingOptionImage, setUploadingOptionImage] = useState<
    number | null
  >(null);

  const handleServiceOptionImageUpload = async (index: number, file: File) => {
    const option = serviceOptions[index];
    if (!option._id) {
      toast.error("Save the profile first before uploading service images");
      return;
    }
    setUploadingOptionImage(index);
    const res = await serviceProviderApi.uploadServiceOptionImage(
      option._id,
      file,
    );
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success("Service image uploaded!");
      // Update the local image for that option
      setServiceOptions((prev) =>
        prev.map((o, i) =>
          i === index
            ? {
                ...o,
                image:
                  res.data!.serviceOptions?.find(
                    (so: ServiceOption) => so._id === option._id,
                  )?.image || o.image,
              }
            : o,
        ),
      );
    }
    setUploadingOptionImage(null);
  };

  const isPetSitting = user?.serviceType === "pet_sitting";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900">
            {provider ? "Manage Service Profile" : "Set Up Your Service"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {provider
              ? "Update your availability, services, and contact info"
              : "Create your service profile so customers can book appointments"}
          </p>
        </motion.div>

        {/* Status banner */}
        {provider && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Your service profile is live and visible to customers
            </p>
          </motion.div>
        )}

        {!provider && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Fill in the details below and create your profile to start
              receiving bookings
            </p>
          </motion.div>
        )}

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Service Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PurrfectCare Veterinary Clinic"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your services..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors resize-none"
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
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors"
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
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, City"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          {!isPetSitting && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Appointment Slot Duration (minutes)
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:outline-none transition-colors"
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

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-teal-500" />
            Images
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Profile Image */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Profile Image
              </label>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
                {imagePreview || imageFile ? (
                  <>
                    <Image
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : imagePreview!
                      }
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/80 rounded-full"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImageFile(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Cover Image
              </label>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
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
                      onClick={() => {
                        setCoverImageFile(null);
                        setCoverImagePreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/80 rounded-full"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Upload</span>
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
            </div>
          </div>
        </motion.div>

        {/* Amenities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900">
            Facility Amenities
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="e.g. Parking, WiFi, AC..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAmenity.trim()) {
                  e.preventDefault();
                  setAmenities((prev) => [...prev, newAmenity.trim()]);
                  setNewAmenity("");
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
            />
            <button
              onClick={() => {
                if (newAmenity.trim()) {
                  setAmenities((prev) => [...prev, newAmenity.trim()]);
                  setNewAmenity("");
                }
              }}
              className="px-3 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
                >
                  {a}
                  <button
                    onClick={() =>
                      setAmenities((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {amenities.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">
              Add amenities like Parking, WiFi, Air Conditioning, etc.
            </p>
          )}
        </motion.div>

        {/* Availability Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Availability Schedule
          </h3>

          <div className="space-y-2">
            {availability.map((slot) => (
              <div
                key={slot.day}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  slot.isAvailable ? "bg-emerald-50" : "bg-gray-50"
                }`}
              >
                <button
                  onClick={() => toggleDay(slot.day)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
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
                  className={`text-sm font-medium w-24 ${slot.isAvailable ? "text-gray-800" : "text-gray-400"}`}
                >
                  {DAY_LABELS[slot.day]}
                </span>

                {slot.isAvailable && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateAvailTime(slot.day, "startTime", e.target.value)
                      }
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-teal-400 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateAvailTime(slot.day, "endTime", e.target.value)
                      }
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Service Options / Packages */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-500" />
              Service Options / Packages
            </h3>
            <button
              onClick={addServiceOption}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {serviceOptions.length === 0 && (
            <p className="text-sm text-gray-400 py-2 text-center">
              No service options yet. Add one so customers know what you offer.
            </p>
          )}

          <AnimatePresence mode="popLayout">
            {serviceOptions.map((option, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border-2 border-gray-100 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Service #{index + 1}
                  </span>
                  <button
                    onClick={() => removeServiceOption(index)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) =>
                      updateServiceOption(index, "name", e.target.value)
                    }
                    placeholder="e.g. General Checkup"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={option.description || ""}
                    onChange={(e) =>
                      updateServiceOption(
                        index,
                        "description",
                        e.target.value || null,
                      )
                    }
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Price (Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={option.price ?? ""}
                      onChange={(e) =>
                        updateServiceOption(
                          index,
                          "price",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                      placeholder="500"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      value={option.duration ?? ""}
                      onChange={(e) =>
                        updateServiceOption(
                          index,
                          "duration",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      placeholder="30"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Service Option Image */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Service Photo
                  </label>
                  {option.image ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={option.image}
                        alt={option.name || "Service"}
                        fill
                        className="object-cover"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-xs font-semibold text-white bg-black/40 px-3 py-1.5 rounded-lg">
                          Change Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleServiceOptionImageUpload(index, f);
                          }}
                        />
                      </label>
                    </div>
                  ) : option._id ? (
                    <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-colors">
                      {uploadingOptionImage === index ? (
                        <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                      ) : (
                        <ImagePlus className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        {uploadingOptionImage === index
                          ? "Uploading..."
                          : "Upload photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingOptionImage === index}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleServiceOptionImageUpload(index, f);
                        }}
                      />
                    </label>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      Save profile first to upload photos
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Save / Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {provider ? (
            <button
              onClick={handleUpdate}
              disabled={isSaving || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-500 text-white font-semibold text-sm rounded-2xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
            >
              {isSaving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-500 text-white font-semibold text-sm rounded-2xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
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
