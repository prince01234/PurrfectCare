"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

import { adoptionListingApi } from "@/lib/api/adoption";
import AdminLayout from "@/components/layout/AdminLayout";

const SPECIES_OPTIONS = [
  "dog",
  "cat",
  "rabbit",
  "bird",
  "hamster",
  "fish",
  "other",
];

const GENDER_OPTIONS = ["male", "female"];

export default function NewAdoptionListingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    age: "",
    description: "",
    healthInfo: "",
    temperament: "",
    specialNeeds: "",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.species) e.species = "Species is required";
    if (!formData.breed.trim()) e.breed = "Breed is required";
    if (!formData.gender) e.gender = "Gender is required";
    if (!formData.age || parseInt(formData.age) < 0)
      e.age = "Valid age is required";
    if (!formData.description.trim()) e.description = "Description is required";
    if (formData.description.trim().length < 10)
      e.description = "Description must be at least 10 characters";
    if (!formData.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    const validFiles = files.filter((f) => {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
      ) {
        toast.error(`${f.name}: Invalid file type`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: File too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setPhotos((prev) => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const result = await adoptionListingApi.createListing(
        { ...formData, age: parseInt(formData.age) },
        photos.length > 0 ? photos : undefined,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Adoption listing created!");
      router.push("/admin/adoption");
    } catch {
      toast.error("Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <button
          onClick={() => router.push("/admin/adoption")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>

        <h2 className="text-lg font-bold text-gray-900">
          Create Adoption Listing
        </h2>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (up to 5)
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photoPreviews.map((preview, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-gray-200"
                >
                  <Image
                    src={preview}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors shrink-0">
                  <ImagePlus className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Buddy"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                errors.name
                  ? "border-red-300"
                  : "border-gray-200 focus:border-teal-400"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Species + Breed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Species *
              </label>
              <select
                name="species"
                value={formData.species}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                  errors.species
                    ? "border-red-300"
                    : "border-gray-200 focus:border-teal-400"
                }`}
              >
                <option value="">Select</option>
                {SPECIES_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              {errors.species && (
                <p className="text-red-500 text-xs mt-1">{errors.species}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breed *
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                placeholder="e.g., Labrador"
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                  errors.breed
                    ? "border-red-300"
                    : "border-gray-200 focus:border-teal-400"
                }`}
              />
              {errors.breed && (
                <p className="text-red-500 text-xs mt-1">{errors.breed}</p>
              )}
            </div>
          </div>

          {/* Gender + Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                  errors.gender
                    ? "border-red-300"
                    : "border-gray-200 focus:border-teal-400"
                }`}
              >
                <option value="">Select</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age (months) *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 12"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                  errors.age
                    ? "border-red-300"
                    : "border-gray-200 focus:border-teal-400"
                }`}
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Kathmandu, Nepal"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-all ${
                errors.location
                  ? "border-red-300"
                  : "border-gray-200 focus:border-teal-400"
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell adopters about this pet's personality, habits, and why they'd be a great companion..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none resize-none transition-all ${
                errors.description
                  ? "border-red-300"
                  : "border-gray-200 focus:border-teal-400"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Health Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Information
            </label>
            <textarea
              name="healthInfo"
              value={formData.healthInfo}
              onChange={handleChange}
              placeholder="Vaccination status, medical conditions, etc."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 outline-none resize-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Temperament */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperament
            </label>
            <input
              type="text"
              name="temperament"
              value={formData.temperament}
              onChange={handleChange}
              placeholder="e.g., Friendly, playful, good with kids"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 outline-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Special Needs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Needs
            </label>
            <input
              type="text"
              name="specialNeeds"
              value={formData.specialNeeds}
              onChange={handleChange}
              placeholder="e.g., Requires medication, special diet"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 outline-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-base bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              "Create Listing"
            )}
          </button>
        </motion.form>
      </div>
    </AdminLayout>
  );
}
