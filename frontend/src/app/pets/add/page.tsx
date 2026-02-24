"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  X,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  PawPrint,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/lib/api";

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog", icon: Dog },
  { value: "cat", label: "Cat", icon: Cat },
  { value: "bird", label: "Bird", icon: Bird },
  { value: "rabbit", label: "Rabbit", icon: Rabbit },
  { value: "fish", label: "Fish", icon: Fish },
  { value: "other", label: "Other", icon: PawPrint },
];

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function AddPetPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [species, setSpecies] = useState("dog");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unknown">("male");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ---- Photo handling ----
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5 MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setPhotos((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Validation ----
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Pet name is required";
    if (!species) errs.species = "Select a species";
    if (age && (isNaN(Number(age)) || Number(age) < 0))
      errs.age = "Enter a valid age";
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0))
      errs.weight = "Enter a valid weight";
    if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime()))
      errs.dateOfBirth = "Enter a valid date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const data: Record<string, string> = {
      name: name.trim(),
      species,
      gender,
    };
    if (breed.trim()) data.breed = breed.trim();
    if (age) data.age = age;
    if (weight) data.weight = weight;
    if (dateOfBirth) data.dateOfBirth = dateOfBirth;
    if (medicalNotes.trim()) data.medicalNotes = medicalNotes.trim();

    const res = await petApi.createPet(
      data,
      photos.length > 0 ? photos : undefined,
    );

    if (res.error) {
      toast.error(res.error);
      if (res.error.toLowerCase().includes("name")) {
        setErrors((prev) => ({ ...prev, name: res.error! }));
      }
      setIsSubmitting(false);
      return;
    }

    toast.success(`${name} added successfully!`);
    router.push("/pets");
  };

  return (
    <MobileLayout showBottomNav={false}>
      {/* Accent bar */}
      <div className="h-1 bg-linear-to-r from-teal-500 to-teal-400" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Add New Pet</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* ---- Species selector ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Species <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {SPECIES_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSpecies(value);
                  setErrors((e) => ({ ...e, species: "" }));
                }}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                  species === value
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <Icon className="w-7 h-7" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
          {errors.species && (
            <p className="text-red-500 text-xs mt-1">{errors.species}</p>
          )}
        </div>

        {/* ---- Photo upload ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Photos <span className="text-gray-400 normal-case">(optional)</span>
          </label>
          <div className="flex gap-3 mt-2 overflow-x-auto hide-scrollbar">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
              >
                <Image
                  src={src}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors shrink-0"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] mt-1">Add</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Max 5 photos, 5 MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* ---- Name ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Pet's name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={`mt-1.5 w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 ${
              errors.name ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* ---- Breed & Age ---- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Breed <span className="text-gray-400 normal-case">(opt)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Golden Retriever"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Age (years){" "}
              <span className="text-gray-400 normal-case">(opt)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 2"
              min="0"
              step="0.5"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setErrors((prev) => ({ ...prev, age: "" }));
              }}
              className={`mt-1.5 w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 ${
                errors.age ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.age && (
              <p className="text-red-500 text-xs mt-1">{errors.age}</p>
            )}
          </div>
        </div>

        {/* ---- Weight ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Weight (kg){" "}
            <span className="text-gray-400 normal-case">(optional)</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 4.5"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setErrors((prev) => ({ ...prev, weight: "" }));
            }}
            className={`mt-1.5 w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 ${
              errors.weight ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.weight && (
            <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
          )}
        </div>

        {/* ---- Date of Birth ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Date of Birth{" "}
            <span className="text-gray-400 normal-case">(optional)</span>
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
            }}
            className={`mt-1.5 w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500/30 ${
              errors.dateOfBirth ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* ---- Sex ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sex <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 mt-1.5">
            {(["male", "female", "unknown"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                  gender === g
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Medical Notes ---- */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Medical Notes{" "}
            <span className="text-gray-400 normal-case">(optional)</span>
          </label>
          <textarea
            placeholder="Allergies, special needs, medications, dietary restrictions, etc."
            rows={3}
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            className="mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
          />
        </div>

        {/* ---- Submit ---- */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Adding…" : "Add Pet"}
        </button>
      </div>
    </MobileLayout>
  );
}
