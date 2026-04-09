"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  Camera,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

import MobileLayout from "@/components/layout/MobileLayout";
import DynamicLocationPicker from "@/components/ui/DynamicLocationPicker";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { PostType } from "@/lib/api/lostFound";

const TOTAL_STEPS = 4;

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
  { value: "hamster", label: "Hamster" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

const PET_GENDER_OPTIONS = ["Unknown", "Male", "Female"];
const PET_SIZE_OPTIONS = ["Unknown", "Small", "Medium", "Large"];
const COMMON_COLOR_OPTIONS = ["Black", "White", "Brown", "Mixed"];

export default function CreateLostFoundPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Post type
  const [postType, setPostType] = useState<PostType | null>(null);

  // Step 2: Pet details
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [petName, setPetName] = useState("");
  const [petGender, setPetGender] = useState("Unknown");
  const [petSize, setPetSize] = useState("Unknown");
  const [collarDetails, setCollarDetails] = useState("");
  const [description, setDescription] = useState("");

  // Step 3: Location & Time
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Step 4: Photos & Reward
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [reward, setReward] = useState("");

  const isLost = postType === "lost";

  // Theme classes
  const theme = {
    progressBar: "bg-teal-400",
    accentBg: "bg-teal-50",
    accentText: "text-teal-700",
    accentBorder: "border-teal-300",
    accentBorderLight: "border-teal-200",
    button: "bg-teal-400 hover:bg-teal-500 active:bg-teal-600",
    selectedCard: "border-teal-300 bg-teal-50",
    selectedChip: "border-teal-300 bg-teal-50 text-teal-700",
    unselectedChip:
      "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
    uploadBorder: "border-teal-200 bg-teal-50/50",
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - photos.length);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setPhotos((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationAddress("Current location");
        toast.success("Location detected!");
      },
      () => {
        toast.error("Unable to get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return postType !== null;
      case 2:
        return species !== "";
      case 3:
        return (
          locationAddress !== "" &&
          latitude !== null &&
          longitude !== null &&
          eventDate !== ""
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!postType || !species || !latitude || !longitude || !eventDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("postType", postType);
      formData.append(
        "title",
        isLost
          ? `Lost ${species} - ${petName || "Unknown"}`
          : `Found ${species} - ${locationAddress}`,
      );
      formData.append("species", species);
      formData.append("locationAddress", locationAddress);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("eventDate", eventDate);

      const extraPetDetails = [
        petGender && petGender !== "Unknown" ? `Gender: ${petGender}` : null,
        petSize && petSize !== "Unknown" ? `Size: ${petSize}` : null,
        collarDetails.trim()
          ? `Collar / Accessory: ${collarDetails.trim()}`
          : null,
      ].filter(Boolean) as string[];

      const mergedDescription = [description.trim(), ...extraPetDetails]
        .filter(Boolean)
        .join("\n");

      if (breed) formData.append("breed", breed);
      if (color) formData.append("color", color);
      if (petName) formData.append("petName", petName);
      if (mergedDescription) formData.append("description", mergedDescription);
      if (reward && isLost) formData.append("reward", reward);

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const { data, error } = await lostFoundApi.createPost(formData);
      if (error) {
        toast.error(error);
        return;
      }
      if (data) {
        toast.success("Alert posted successfully!");
        router.push(`/lost-and-found/${data._id}`);
      }
    } catch {
      toast.error("Failed to post alert. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className={`h-full ${postType ? theme.progressBar : "bg-gray-400"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-6 pb-24">
          <AnimatePresence mode="wait">
            {/* Step 1: What happened? */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  What happened?
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  Choose the type of report to file.
                </p>

                <div className="space-y-4">
                  {/* I Lost a Pet */}
                  <button
                    onClick={() => setPostType("lost")}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      postType === "lost"
                        ? "border-rose-300 bg-rose-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          postType === "lost" ? "bg-rose-100" : "bg-gray-100"
                        }`}
                      >
                        <AlertTriangle
                          className={`w-6 h-6 ${
                            postType === "lost"
                              ? "text-rose-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          I Lost a Pet
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          My pet is missing and I need help.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* I Found a Pet */}
                  <button
                    onClick={() => setPostType("found")}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      postType === "found"
                        ? "border-teal-300 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          postType === "found" ? "bg-teal-100" : "bg-gray-100"
                        }`}
                      >
                        <Search
                          className={`w-6 h-6 ${
                            postType === "found"
                              ? "text-teal-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          I Found a Pet
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          I found a lost pet and want to help.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pet Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Pet Details
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  Add clear details so people can identify this pet faster.
                </p>

                {/* Species */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Species
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SPECIES_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSpecies(opt.value)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          species === opt.value
                            ? theme.selectedChip
                            : theme.unselectedChip
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Breed & Color */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Breed
                    </label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g. Lab"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Golden"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    />
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {COMMON_COLOR_OPTIONS.map((colorOption) => (
                    <button
                      key={colorOption}
                      type="button"
                      onClick={() => setColor(colorOption)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        color.toLowerCase() === colorOption.toLowerCase()
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 text-gray-600 bg-white"
                      }`}
                    >
                      {colorOption}
                    </button>
                  ))}
                </div>

                {/* Pet Name */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {isLost ? "Pet's Name" : "Name (if tag present)"}
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder={isLost ? "Pet's name" : "Unknown"}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Gender
                    </label>
                    <select
                      value={petGender}
                      onChange={(e) => setPetGender(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    >
                      {PET_GENDER_OPTIONS.map((genderOption) => (
                        <option key={genderOption} value={genderOption}>
                          {genderOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Size
                    </label>
                    <select
                      value={petSize}
                      onChange={(e) => setPetSize(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    >
                      {PET_SIZE_OPTIONS.map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Collar / Accessory
                  </label>
                  <input
                    type="text"
                    value={collarDetails}
                    onChange={(e) => setCollarDetails(e.target.value)}
                    placeholder="e.g. Red collar with bell"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                  />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Distinguishing marks, collar type, behavior..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Tip: mention behavior, nearby landmark, and time last seen.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Location & Time */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                  Location & Time
                </h1>

                {/* Location Address */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {isLost ? "Last Seen Location" : "Found Location"}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="Enter address or landmark"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className={`mt-2 text-xs font-medium ${theme.accentText} flex items-center gap-1`}
                  >
                    <MapPin className="w-3 h-3" />
                    Use current location
                  </button>
                </div>

                {/* Map Picker */}
                <div className="mb-5">
                  <DynamicLocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      if (
                        !locationAddress ||
                        locationAddress === "Current location"
                      ) {
                        setLocationAddress(
                          `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                        );
                      }
                    }}
                  />
                </div>

                {/* Date */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Photos & Reward */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                  Photos{isLost ? " & Reward" : ""}
                </h1>

                {/* Photo Upload */}
                <div className="mb-6">
                  {photoPreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {photoPreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-xl overflow-hidden"
                        >
                          <Image
                            src={preview}
                            alt={`Photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✕</span>
                          </button>
                        </div>
                      ))}
                      {photos.length < 5 && (
                        <label
                          className={`aspect-square rounded-xl border-2 border-dashed ${theme.uploadBorder} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <Camera
                            className={`w-6 h-6 ${theme.accentText} opacity-50`}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed ${theme.uploadBorder} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <Camera
                        className={`w-10 h-10 ${theme.accentText} opacity-60 mb-3`}
                      />
                      <span className="font-semibold text-gray-700 text-sm">
                        Upload Pet Photo
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Clear photos help 80% more
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Reward (only for lost) */}
                {isLost && (
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Offer Reward (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        placeholder="Amount"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Rewards can encourage community help.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-5 py-4">
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${theme.button}`}
            >
              Next Step &gt;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${theme.button}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Alert"
              )}
            </button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
