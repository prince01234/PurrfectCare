"use client";

import React, { useCallback, useEffect, useRef, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Clock3,
  HeartPulse,
  PawPrint,
  Pencil,
  Plus,
  Syringe,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/lib/api";
import type { MedicalRecord, Pet, Reminder, Vaccination } from "@/lib/api";

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
  { value: "hamster", label: "Hamster" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

const GENDER_OPTIONS = ["male", "female", "unknown"] as const;

const REMINDER_TYPES = [
  { value: "feeding_schedule", label: "Feeding Schedule" },
  { value: "vaccination_due", label: "Vaccination Due" },
  { value: "medication", label: "Medication" },
  { value: "vet_checkup", label: "Vet Checkup" },
  { value: "preventive_care", label: "Preventive Care" },
  { value: "grooming", label: "Grooming" },
  { value: "hygiene_dental", label: "Hygiene/Dental" },
  { value: "custom", label: "Custom" },
];

const REMINDER_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const REMINDER_FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

type Tab = "overview" | "health" | "reminders";

function getAge(pet: Pet): string {
  const age = pet.calculatedAge ?? pet.age;
  if (age === null || age === undefined) return "";
  if (age === 0) return "< 1 yr";
  // Handle fractional ages like 2.5
  if (age % 1 !== 0) {
    const years = Math.floor(age);
    const months = Math.round((age % 1) * 12);
    if (years === 0) return `${months} mo`;
    return `${years} yr${years > 1 ? "s" : ""} ${months} mo`;
  }
  if (age === 1) return "1 yr";
  return `${age} yrs`;
}

function fmtDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMonth(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function reminderTypeLabel(value: string) {
  const label = value.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function fmtTime(value: string | null | undefined) {
  if (!value) return "";
  const [h = "0", m = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function reminderPriorityStyles(priority: string) {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "low":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

export default function PetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const [pet, setPet] = useState<Pet | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    species: "dog",
    breed: "",
    gender: "male",
    age: "",
    dateOfBirth: "",
    medicalNotes: "",
  });

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    reminderType: "feeding_schedule",
    dueDate: "",
    dueTime: "09:00",
    frequency: "once",
    priority: "medium",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const petRes = await petApi.getPetById(id);
      if (!cancelled && petRes.data) {
        setPet(petRes.data);
        setForm({
          name: petRes.data.name,
          species: petRes.data.species,
          breed: petRes.data.breed || "",
          gender: petRes.data.gender,
          age: petRes.data.age?.toString() || "",
          dateOfBirth: petRes.data.dateOfBirth
            ? new Date(petRes.data.dateOfBirth).toISOString().split("T")[0]
            : "",
          medicalNotes: petRes.data.medicalNotes || "",
        });
      } else if (!cancelled) {
        toast.error(petRes.error || "Failed to load pet");
      }

      const [vacRes, mrRes, remRes] = await Promise.all([
        petApi.getVaccinations(id),
        petApi.getMedicalRecords(id),
        petApi.getReminders(id, {
          includeCompleted: true,
          limit: 100,
          sortBy: "dueDate",
          sortOrder: "asc",
        }),
      ]);

      if (!cancelled) {
        if (vacRes.data) {
          const list = Array.isArray(vacRes.data)
            ? vacRes.data
            : (vacRes.data as unknown as { vaccinations: Vaccination[] })
                .vaccinations || [];
          setVaccinations(list);
        }
        if (mrRes.data) {
          const list = Array.isArray(mrRes.data)
            ? mrRes.data
            : (mrRes.data as unknown as { medicalRecords: MedicalRecord[] })
                .medicalRecords || [];
          setMedicalRecords(list);
        }
        if (remRes.data) {
          const list = Array.isArray(remRes.data)
            ? remRes.data
            : (remRes.data as unknown as { reminders: Reminder[] }).reminders ||
              [];
          setReminders(list);
        }
      }

      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, id]);

  const safePhotoIndex = pet?.photos?.length
    ? Math.min(photoIndex, pet.photos.length - 1)
    : 0;

  const nextPhoto = useCallback(() => {
    if (!pet?.photos?.length) return;
    setPhotoIndex((index) => (index + 1) % pet.photos.length);
  }, [pet?.photos]);

  const prevPhoto = useCallback(() => {
    if (!pet?.photos?.length) return;
    setPhotoIndex(
      (index) => (index - 1 + pet.photos.length) % pet.photos.length,
    );
  }, [pet?.photos]);

  const handleGalleryDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!pet?.photos || pet.photos.length <= 1) return;

      const threshold = 50;
      if (info.offset.x < -threshold || info.velocity.x < -500) {
        nextPhoto();
      } else if (info.offset.x > threshold || info.velocity.x > 500) {
        prevPhoto();
      }
    },
    [nextPhoto, pet?.photos, prevPhoto],
  );

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Pet name is required");
      return;
    }

    setIsSaving(true);
    const data: Record<string, string> = {
      name: form.name.trim(),
      species: form.species,
      gender: form.gender,
    };
    if (form.breed.trim()) data.breed = form.breed.trim();
    if (form.age) data.age = form.age;
    if (form.dateOfBirth) data.dateOfBirth = form.dateOfBirth;
    if (form.medicalNotes.trim()) data.medicalNotes = form.medicalNotes.trim();

    const res = await petApi.updatePet(id, data);
    if (res.error) {
      toast.error(res.error);
      setIsSaving(false);
      return;
    }
    if (res.data) {
      setPet(res.data);
      toast.success("Pet updated");
      setEditMode(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await petApi.deletePet(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`${pet?.name || "Pet"} removed`);
      router.push("/pets");
    }
    setIsDeleting(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5 MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const previews = validFiles.map((f) => URL.createObjectURL(f));
      setNewPhotos((prev) => [...prev, ...validFiles]);
      setNewPhotoPreviews((prev) => [...prev, ...previews]);
    }

    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (newPhotos.length === 0) return;
    setIsPhotoUploading(true);
    const res = await petApi.addPetPhotos(id, newPhotos);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data?.pet) {
      setPet(res.data.pet);
      setNewPhotos([]);
      setNewPhotoPreviews([]);
      toast.success("Photos added");
    }
    setIsPhotoUploading(false);
  };

  const deletePhoto = async (photoUrl: string) => {
    const res = await petApi.deletePetPhoto(id, photoUrl);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data?.pet) {
      setPet(res.data.pet);
      toast.success("Photo removed");
    }
  };

  const addReminder = async () => {
    if (!reminderForm.title.trim() || !reminderForm.dueDate) {
      toast.error("Title and due date are required");
      return;
    }

    const payload = {
      title: reminderForm.title.trim(),
      description: reminderForm.description.trim() || undefined,
      reminderType: reminderForm.reminderType,
      dueDate: reminderForm.dueDate,
      dueTime: reminderForm.dueTime,
      frequency: reminderForm.frequency,
      priority: reminderForm.priority,
    };

    const res = await petApi.createReminder(id, payload);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    const newReminder =
      (res.data as unknown as { reminder?: Reminder })?.reminder ??
      (res.data as Reminder | undefined);
    if (newReminder) {
      setReminders((prev) => [...prev, newReminder]);
      toast.success("Reminder added");
      setShowAddReminder(false);
      setReminderForm({
        title: "",
        description: "",
        reminderType: "feeding_schedule",
        dueDate: "",
        dueTime: "09:00",
        frequency: "once",
        priority: "medium",
      });
    }
  };

  const deleteReminder = async (reminderId: string) => {
    const res = await petApi.deleteReminder(id, reminderId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setReminders((prev) => prev.filter((r) => r._id !== reminderId));
    toast.success("Reminder removed");
  };

  const markReminderCompleted = async (reminderId: string) => {
    const res = await petApi.completeReminder(id, reminderId);
    if (res.error) {
      toast.error(res.error);
      return;
    }

    const updatedReminder =
      (res.data as unknown as { reminder?: Reminder })?.reminder ??
      (res.data as Reminder | undefined);

    if (!updatedReminder) return;

    setReminders((prev) =>
      prev.map((item) => (item._id === reminderId ? updatedReminder : item)),
    );
    toast.success("Marked as completed");
  };

  const dismissReminder = async (reminderId: string) => {
    const res = await petApi.dismissReminder(id, reminderId);
    if (res.error) {
      toast.error(res.error);
      return;
    }

    const updatedReminder =
      (res.data as unknown as { reminder?: Reminder })?.reminder ??
      (res.data as Reminder | undefined);

    if (!updatedReminder) return;

    setReminders((prev) =>
      prev.map((item) => (item._id === reminderId ? updatedReminder : item)),
    );
    toast.success("Reminder dismissed");
  };

  if (authLoading || isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  if (!pet) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <PawPrint className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">Pet not found</p>
          <button
            onClick={() => router.push("/pets")}
            className="text-teal-600 text-sm font-medium"
          >
            Back to My Pets
          </button>
        </div>
      </MobileLayout>
    );
  }

  const latestWeight =
    medicalRecords.find((r) => r.weight !== null)?.weight ?? null;
  const lastVaccination =
    vaccinations.length > 0
      ? vaccinations.reduce((a, b) =>
          new Date(a.dateGiven) > new Date(b.dateGiven) ? a : b,
        )
      : null;
  const activeReminders = reminders.filter((r) => r.status === "active");
  const completedReminders = reminders.filter((r) => r.status === "completed");
  const dismissedReminders = reminders.filter((r) => r.status === "dismissed");
  const overdueReminders = activeReminders.filter((r) => r.isOverdue);
  const upcomingReminders = activeReminders
    .filter((r) => !r.isOverdue)
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  const today = startOfDay();
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const overdueVaccinations = vaccinations.filter((v) => {
    if (!v.nextDueDate) return false;
    return new Date(v.nextDueDate) < today;
  });
  const upcomingVaccinations = vaccinations
    .filter((v) => {
      if (!v.nextDueDate) return false;
      const dueDate = new Date(v.nextDueDate);
      return dueDate >= today && dueDate <= in30Days;
    })
    .sort(
      (a, b) =>
        new Date(a.nextDueDate ?? a.dateGiven).getTime() -
        new Date(b.nextDueDate ?? b.dateGiven).getTime(),
    );

  const recentMedicalRecords = [...medicalRecords]
    .sort(
      (a, b) =>
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
    )
    .slice(0, 3);

  const followUpDueNow = medicalRecords
    .filter((record) => record.followUpDate && record.isFollowUpDue)
    .sort(
      (a, b) =>
        new Date(a.followUpDate ?? a.visitDate).getTime() -
        new Date(b.followUpDate ?? b.visitDate).getTime(),
    );

  const followUpUpcoming = medicalRecords
    .filter((record) => {
      if (!record.followUpDate) return false;
      const followUp = new Date(record.followUpDate);
      return followUp > today;
    })
    .sort(
      (a, b) =>
        new Date(a.followUpDate ?? a.visitDate).getTime() -
        new Date(b.followUpDate ?? b.visitDate).getTime(),
    )
    .slice(0, 3);

  const remindersDueToday = activeReminders.filter((r) =>
    isSameDay(new Date(r.dueDate), today),
  );
  const highPriorityReminders = activeReminders.filter(
    (r) => r.priority === "high" || r.priority === "critical",
  );

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50 pb-10">
        {/* Photo gallery — full cover like adoption detail page */}
        <div
          ref={galleryRef}
          className="relative h-[52vh] min-h-80 overflow-hidden bg-gray-200"
        >
          {pet.photos[0] ? (
            <motion.div
              className="relative h-full w-full cursor-grab active:cursor-grabbing"
              drag={pet.photos.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleGalleryDragEnd}
            >
              <Image
                src={pet.photos[safePhotoIndex]}
                alt={pet.name}
                fill
                className="object-cover pointer-events-none select-none"
                sizes="(max-width: 32rem) 100vw, 32rem"
                priority
                draggable={false}
              />
            </motion.div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
              <PawPrint className="h-20 w-20 text-teal-300" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-black/50 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <h1 className="text-base font-bold text-white drop-shadow-sm">
                Pet Profile
              </h1>
              <button
                onClick={() => setEditMode((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors ${
                  editMode
                    ? "bg-teal-500 text-white"
                    : "bg-white/85 text-gray-700"
                }`}
                aria-label="Edit pet"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Photo nav arrows */}
          {pet.photos.length > 1 && (
            <div className="absolute bottom-18 left-0 right-0 z-20">
              <div className="flex items-center justify-center gap-2">
                {pet.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === safePhotoIndex
                        ? "h-2 w-8 bg-white shadow-lg"
                        : "h-2 w-2 bg-white/60"
                    }`}
                    aria-label={`View photo ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pet name + breed on photo */}
          <div className="hidden absolute bottom-4 left-5 right-5 z-10">
            <h2 className="text-white text-2xl font-bold drop-shadow-sm">
              {pet.name}
            </h2>
            <p className="text-white/80 text-sm mt-0.5">
              {pet.breed ||
                pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
              {getAge(pet) ? ` · ${getAge(pet)}` : ""}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 -mt-8 px-4"
        >
          <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-black/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold text-gray-900">
                  {pet.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {pet.breed ||
                    pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Species
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                  {pet.species}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Gender
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                  {pet.gender}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Age
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {getAge(pet) || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Date of Birth
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {fmtDate(pet.dateOfBirth)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Latest Weight
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {latestWeight ? `${latestWeight} kg` : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="px-4 py-6">
          <div className="sticky top-3 z-20 mb-5 rounded-2xl border border-gray-100 bg-white/90 p-1.5 shadow-sm backdrop-blur">
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: "overview", label: "Overview", icon: PawPrint },
                  { key: "health", label: "Health", icon: HeartPulse },
                  { key: "reminders", label: "Reminders", icon: Bell },
                ] as {
                  key: Tab;
                  label: string;
                  icon: React.ComponentType<{ className?: string }>;
                }[]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Edit form */}
                {editMode && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-gray-900">Edit Details</h3>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mt-1.5 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                          Species *
                        </label>
                        <select
                          value={form.species}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              species: e.target.value,
                            }))
                          }
                          className="mt-1.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          {SPECIES_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                          Gender *
                        </label>
                        <select
                          value={form.gender}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              gender: e.target.value,
                            }))
                          }
                          className="mt-1.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          {GENDER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                          Breed (optional)
                        </label>
                        <input
                          type="text"
                          value={form.breed}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              breed: e.target.value,
                            }))
                          }
                          className="mt-1.5 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                          Age (optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.age}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              age: e.target.value,
                            }))
                          }
                          className="mt-1.5 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Date of Birth (optional)
                      </label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Medical Notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={form.medicalNotes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            medicalNotes: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50"
                      >
                        {isSaving ? "Saving" : "Save Changes"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">* Required field</p>
                  </div>
                )}

                {/* Photo management */}
                {editMode && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-gray-900">Photos</h3>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                      {pet.photos.map((src, i) => (
                        <div
                          key={src}
                          className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0"
                        >
                          <Image
                            src={src}
                            alt={`Photo ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => deletePhoto(src)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                            aria-label="Remove photo"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}

                      {newPhotoPreviews.map((src, i) => (
                        <div
                          key={src}
                          className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0"
                        >
                          <Image
                            src={src}
                            alt={`New photo ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => removeNewPhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                            aria-label="Remove new photo"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}

                      {pet.photos.length + newPhotoPreviews.length < 10 && (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors shrink-0"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px] mt-1">Add</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={uploadPhotos}
                        disabled={isPhotoUploading || newPhotos.length === 0}
                        className="flex-1 py-2.5 rounded-lg bg-teal-50 text-teal-700 font-medium disabled:opacity-50"
                      >
                        {isPhotoUploading ? "Uploading" : "Upload New Photos"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Max 10 photos. 5 MB each.
                    </p>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Care Snapshot
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-gray-900">
                        {vaccinations.length}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">Vaccines</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-gray-900">
                        {medicalRecords.length}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">Records</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-gray-900">
                        {activeReminders.length}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Reminders
                      </p>
                    </div>
                  </div>
                </div>

                {(pet.medicalNotes ||
                  lastVaccination ||
                  latestWeight !== null) && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {pet.medicalNotes || "No notes added yet."}
                      </p>
                    </div>
                  </div>
                )}

                {!editMode && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-500"
                  >
                    Remove Pet
                  </button>
                )}
              </motion.div>
            )}

            {tab === "health" && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Vaccines Due
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {overdueVaccinations.length}
                    </p>
                    <p className="mt-1 text-xs text-red-500">
                      {upcomingVaccinations.length} upcoming (30 days)
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Follow-ups
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {followUpDueNow.length}
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      {followUpUpcoming.length} upcoming
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                        <Syringe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Vaccinations
                        </h4>
                        <p className="text-xs text-gray-400">
                          {vaccinations.length > 0
                            ? `Last updated: ${fmtMonth(lastVaccination?.dateGiven ?? null)}`
                            : "No records yet"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                      {vaccinations.length}
                    </span>
                  </div>

                  {overdueVaccinations.length > 0 && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {overdueVaccinations.length} vaccination
                      {overdueVaccinations.length === 1 ? " is" : "s are"}{" "}
                      overdue.
                    </div>
                  )}

                  {upcomingVaccinations.slice(0, 2).map((vaccine) => (
                    <div
                      key={vaccine._id}
                      className="mt-3 rounded-xl border border-gray-100 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {vaccine.vaccineName}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Due {fmtDate(vaccine.nextDueDate)}
                        {vaccine.clinic ? ` · ${vaccine.clinic}` : ""}
                      </p>
                    </div>
                  ))}

                  {vaccinations.length === 0 && (
                    <p className="mt-3 text-sm text-gray-400">
                      No vaccination records yet.
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Medical Records
                        </h4>
                        <p className="text-xs text-gray-400">
                          {medicalRecords.length} record
                          {medicalRecords.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                      {medicalRecords.length}
                    </span>
                  </div>

                  {followUpDueNow.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {followUpDueNow.length} follow-up
                      {followUpDueNow.length === 1 ? " is" : "s are"} due now.
                    </div>
                  )}

                  {recentMedicalRecords.map((record) => (
                    <div
                      key={record._id}
                      className="mt-3 rounded-xl border border-gray-100 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {record.reasonForVisit}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {fmtDate(record.visitDate)}
                        {record.vetName ? ` · Dr. ${record.vetName}` : ""}
                      </p>
                      {record.followUpDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Follow-up: {fmtDate(record.followUpDate)}
                        </p>
                      )}
                    </div>
                  ))}

                  {medicalRecords.length === 0 && (
                    <p className="mt-3 text-sm text-gray-400">
                      No medical records yet.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "reminders" && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-600 font-medium hover:bg-teal-100"
                >
                  <Plus className="w-4 h-4" /> Add Reminder
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
                      Overdue
                    </p>
                    <p className="mt-1 text-xl font-bold text-red-700">
                      {overdueReminders.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">
                      Due Today
                    </p>
                    <p className="mt-1 text-xl font-bold text-teal-700">
                      {remindersDueToday.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                      High Priority
                    </p>
                    <p className="mt-1 text-xl font-bold text-orange-700">
                      {highPriorityReminders.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Completed
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-700">
                      {completedReminders.length}
                    </p>
                  </div>
                </div>

                {overdueReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-500 uppercase mb-2">
                      Overdue
                    </h4>
                    {overdueReminders.map((r) => (
                      <ReminderCard
                        key={r._id}
                        reminder={r}
                        overdue
                        onComplete={() => markReminderCompleted(r._id)}
                        onDismiss={() => dismissReminder(r._id)}
                        onDelete={() => deleteReminder(r._id)}
                      />
                    ))}
                  </div>
                )}

                {upcomingReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Upcoming
                    </h4>
                    {upcomingReminders.map((r) => (
                      <ReminderCard
                        key={r._id}
                        reminder={r}
                        onComplete={() => markReminderCompleted(r._id)}
                        onDismiss={() => dismissReminder(r._id)}
                        onDelete={() => deleteReminder(r._id)}
                      />
                    ))}
                  </div>
                )}

                {completedReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Completed
                    </h4>
                    {completedReminders.map((r) => (
                      <ReminderCard
                        key={r._id}
                        reminder={r}
                        showActions={false}
                        onDelete={() => deleteReminder(r._id)}
                      />
                    ))}
                  </div>
                )}

                {dismissedReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Dismissed
                    </h4>
                    {dismissedReminders.map((r) => (
                      <ReminderCard
                        key={r._id}
                        reminder={r}
                        showActions={false}
                        onDelete={() => deleteReminder(r._id)}
                      />
                    ))}
                  </div>
                )}

                {reminders.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No reminders yet</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showAddReminder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
            onClick={() => setShowAddReminder(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                Add Reminder
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={reminderForm.title}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reminderForm.description}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Type
                  </label>
                  <select
                    value={reminderForm.reminderType}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        reminderType: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {REMINDER_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={reminderForm.dueDate}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={reminderForm.dueTime}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        dueTime: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Frequency
                  </label>
                  <select
                    value={reminderForm.frequency}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {REMINDER_FREQUENCIES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Priority
                  </label>
                  <select
                    value={reminderForm.priority}
                    onChange={(e) =>
                      setReminderForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {REMINDER_PRIORITIES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddReminder(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addReminder}
                  className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-gray-900 text-lg">Remove Pet?</h3>
              <p className="text-sm text-gray-500">
                This will remove <strong>{pet.name}</strong> from your pets
                list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50"
                >
                  {isDeleting ? "Removing" : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}

function ReminderCard({
  reminder,
  overdue = false,
  showActions = true,
  onComplete,
  onDismiss,
  onDelete,
}: {
  reminder: Reminder;
  overdue?: boolean;
  showActions?: boolean;
  onComplete?: () => void;
  onDismiss?: () => void;
  onDelete: () => void;
}) {
  const typeIcon = () => {
    switch (reminder.reminderType) {
      case "vaccination_due":
        return <Syringe className="w-4 h-4" />;
      case "vet_checkup":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const isCompleted = reminder.status === "completed";
  const isDismissed = reminder.status === "dismissed";

  return (
    <div
      className={`mb-3 rounded-2xl p-4 border ${
        overdue ? "bg-red-50 border-red-100" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            overdue ? "bg-red-100 text-red-500" : "bg-teal-50 text-teal-500"
          }`}
        >
          {typeIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {reminder.title}
            </p>
            <button
              onClick={onDelete}
              className="p-2 -mr-2 -mt-1 hover:bg-gray-100 rounded-lg"
              aria-label="Delete reminder"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p
            className={`text-xs ${overdue ? "text-red-500" : "text-gray-500"}`}
          >
            {reminderTypeLabel(reminder.reminderType)}
            {" · "}
            {new Date(reminder.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {reminder.dueTime ? ` at ${fmtTime(reminder.dueTime)}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${reminderPriorityStyles(reminder.priority)}`}
            >
              {reminder.priority}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-600">
              {reminder.frequency}
            </span>
            {reminder.sendEmail && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                Email on
              </span>
            )}
            {isCompleted && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Completed
              </span>
            )}
            {isDismissed && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Dismissed
              </span>
            )}
          </div>

          {showActions && !isCompleted && !isDismissed && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onComplete}
                className="flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </button>
              <button
                onClick={onDismiss}
                className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600"
              >
                <Clock3 className="h-3.5 w-3.5" /> Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
