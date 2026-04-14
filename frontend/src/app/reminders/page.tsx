"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/lib/api";
import type { Reminder } from "@/lib/api";

interface ReminderListItem {
  id: string;
  petId: string;
  petName: string;
  petImage: string | null;
  title: string;
  type: string;
  dueDate: string;
  dueTime: string | null;
  priority: string;
  status: string;
  isOverdue: boolean;
}

const resolveReminderPetMeta = (petRef: Reminder["petId"]) => {
  if (typeof petRef === "string") {
    return {
      id: petRef,
      name: "Pet",
      image: null as string | null,
    };
  }

  const id = petRef?._id;
  if (!id) {
    return null;
  }

  return {
    id,
    name: petRef.name || "Pet",
    image: petRef.photos?.[0] || null,
  };
};

const formatReminderType = (type: string) =>
  type
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDueDay = (dateString: string) => {
  const due = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(due);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return "Yesterday";
  return `${Math.abs(diffDays)} days ago`;
};

const toReminderTimestamp = (reminder: ReminderListItem) => {
  const date = new Date(reminder.dueDate);

  if (reminder.dueTime) {
    const [hours, minutes] = reminder.dueTime.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      date.setHours(hours, minutes, 0, 0);
    }
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.getTime();
};

const getPriorityClasses = (priority: string) => {
  if (priority === "critical" || priority === "high") {
    return "bg-red-100 text-red-700";
  }
  if (priority === "medium") {
    return "bg-orange-100 text-orange-700";
  }
  return "bg-gray-100 text-gray-700";
};

export default function RemindersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [reminders, setReminders] = useState<ReminderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    let isCancelled = false;

    const loadReminders = async () => {
      try {
        setIsLoading(true);

        const res = await petApi.getAllReminders({
          limit: 200,
          includeCompleted: false,
          includeDeleted: false,
          sortBy: "dueDate",
          sortOrder: "asc",
        });

        if (res.error) {
          throw new Error(res.error);
        }

        const mapped = (res.data?.reminders || [])
          .map((reminder: Reminder) => {
            const petMeta = resolveReminderPetMeta(reminder.petId);
            if (!petMeta) {
              return null;
            }

            const reminderTimestamp = toReminderTimestamp({
              id: reminder._id,
              petId: petMeta.id,
              petName: petMeta.name,
              petImage: petMeta.image,
              title: reminder.title,
              type: reminder.reminderType,
              dueDate: reminder.dueDate,
              dueTime: reminder.dueTime || null,
              priority: reminder.priority,
              status: reminder.status,
              isOverdue: false,
            });

            return {
              id: reminder._id,
              petId: petMeta.id,
              petName: petMeta.name,
              petImage: petMeta.image,
              title: reminder.title,
              type: reminder.reminderType,
              dueDate: reminder.dueDate,
              dueTime: reminder.dueTime || null,
              priority: reminder.priority,
              status: reminder.status,
              isOverdue:
                reminderTimestamp < Date.now() && reminder.status === "active",
            };
          })
          .filter((reminder): reminder is ReminderListItem =>
            Boolean(reminder),
          );

        mapped.sort((a, b) => {
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          return toReminderTimestamp(a) - toReminderTimestamp(b);
        });

        if (!isCancelled) {
          setReminders(mapped);
        }
      } catch (error) {
        console.error("Failed to load reminders:", error);
        if (!isCancelled) {
          toast.error("Failed to load reminders");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadReminders();

    return () => {
      isCancelled = true;
    };
  }, [user, authLoading]);

  const reminderCountLabel = useMemo(() => {
    if (reminders.length === 1) {
      return "1 reminder";
    }
    return `${reminders.length} reminders`;
  }, [reminders.length]);

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900">Reminders</h1>
              {!authLoading && user && (
                <p className="text-sm text-gray-500">{reminderCountLabel}</p>
              )}
            </div>
          </div>
        </div>

        {!authLoading && !user ? (
          <div className="mx-auto max-w-lg px-4 pt-6">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-4">
              <p className="text-sm text-teal-800">
                Sign in to see your reminders across all pets.
              </p>
              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg px-4 pt-4">
            {isLoading || authLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white"
                  />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600">No reminders yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Create reminders from your pet profile page.
                </p>
                <Link
                  href="/pets"
                  className="mt-4 inline-block rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Open pets
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {reminders.map((reminder) => (
                  <Link
                    key={reminder.id}
                    href={`/pets/${reminder.petId}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {reminder.petImage ? (
                          <Image
                            src={reminder.petImage}
                            alt={reminder.petName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            🐾
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-gray-900">
                          {reminder.petName}
                        </h3>
                        <p className="truncate text-sm font-medium text-teal-600">
                          {formatReminderType(reminder.type)}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {reminder.title}
                        </p>
                        <p
                          className={`mt-0.5 text-sm font-semibold ${
                            reminder.isOverdue
                              ? "text-red-600"
                              : "text-teal-600"
                          }`}
                        >
                          {reminder.isOverdue
                            ? "⚠️ OVERDUE"
                            : formatDueDay(reminder.dueDate)}
                          {!reminder.isOverdue && reminder.dueTime && (
                            <span className="text-gray-500">
                              {" "}
                              • {reminder.dueTime}
                            </span>
                          )}
                          {reminder.status === "snoozed" && (
                            <span className="text-amber-600"> • Snoozed</span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getPriorityClasses(reminder.priority)}`}
                        >
                          {reminder.priority.charAt(0).toUpperCase() +
                            reminder.priority.slice(1)}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
