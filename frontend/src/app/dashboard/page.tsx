"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationCenterContext";
import { petApi } from "@/lib/api";
import type { Pet, Reminder } from "@/lib/api";
import MobileLayout from "@/components/layout/MobileLayout";
import HeroSection from "@/components/home/HeroSection";
import PetServices from "@/components/home/PetServices";
import MarketplaceBanner from "@/components/home/MarketplaceBanner";
import LostAndFound from "@/components/home/LostAndFound";

interface UpcomingReminder {
  id: string;
  petId: string;
  petName: string;
  petImage: string | null;
  title: string;
  type: string;
  dueDate: string;
  dueTime: string | null;
  priority: string;
  isOverdue: boolean;
}

const MAX_VISIBLE_REMINDERS = 2;

const resolveReminderPetId = (petRef: unknown): string | null => {
  if (typeof petRef === "string") {
    return petRef;
  }

  if (petRef && typeof petRef === "object" && "_id" in petRef) {
    const id = (petRef as { _id?: unknown })._id;
    return typeof id === "string" ? id : null;
  }

  return null;
};

const isUpcomingReminder = (
  reminder: UpcomingReminder | null,
): reminder is UpcomingReminder => Boolean(reminder);

const formatReminderType = (type: string) =>
  type
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function formatDueDate(dateString: string): string {
  const due = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (due.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  const days = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days > 0) {
    return `In ${days} day${days > 1 ? "s" : ""}`;
  }
  return `${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago`;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { unreadCount, openSheet } = useNotifications();
  const router = useRouter();
  const [upcomingReminders, setUpcomingReminders] = useState<
    UpcomingReminder[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep onboarding protection for signed-in users only.
  useEffect(() => {
    if (!authLoading && user && !user.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [user, authLoading, router]);

  // Fetch pets and their reminders
  useEffect(() => {
    if (!user || authLoading) return;

    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [petsRes, remindersRes] = await Promise.all([
          petApi.getPets({ limit: 100 }),
          petApi.getAllReminders(),
        ]);

        if (petsRes.error) {
          throw new Error(petsRes.error);
        }

        if (!petsRes.data?.pets) {
          if (!isCancelled) {
            setUpcomingReminders([]);
          }
          setIsLoading(false);
          return;
        }

        const allPets = petsRes.data.pets;

        const petById = new Map(
          allPets.map((pet: Pet) => [
            pet._id,
            { name: pet.name, image: pet.photos?.[0] || null },
          ]),
        );

        const reminders = remindersRes.data?.reminders || [];

        const allReminders: UpcomingReminder[] = reminders
          .filter((reminder: Reminder) => {
            const reminderPetId = resolveReminderPetId(reminder.petId);

            return (
              (reminder.status === "active" || reminder.status === "snoozed") &&
              Boolean(reminderPetId && petById.get(reminderPetId))
            );
          })
          .map((reminder: Reminder) => {
            const reminderPetId = resolveReminderPetId(reminder.petId);

            if (!reminderPetId) {
              return null;
            }

            const petMeta = petById.get(reminderPetId);
            if (!petMeta) {
              return null;
            }

            return {
              id: reminder._id,
              petId: reminderPetId,
              petName: petMeta.name,
              petImage: petMeta.image,
              title: reminder.title,
              type: reminder.reminderType,
              dueDate: reminder.dueDate,
              dueTime: reminder.dueTime || null,
              priority: reminder.priority,
              isOverdue:
                new Date(reminder.dueDate).getTime() < Date.now() &&
                reminder.status === "active",
            };
          })
          .filter(isUpcomingReminder);

        // Sort by due date and priority
        allReminders.sort((a, b) => {
          // Overdue items first
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;

          // Then by date
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          return dateA - dateB;
        });

        if (!isCancelled) {
          setUpcomingReminders(allReminders);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!isCancelled) {
          toast.error("Failed to load dashboard data");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const visibleReminders = upcomingReminders.slice(0, MAX_VISIBLE_REMINDERS);

  return (
    <MobileLayout>
      <HeroSection
        userName={user?.name}
        isGuest={!user}
        notificationCount={user ? unreadCount : 0}
        onNotificationClick={user ? openSheet : undefined}
      />

      {/* Upcoming Reminders Section */}
      {user && visibleReminders.length > 0 && (
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Upcoming Reminders
            </h2>
            <Link
              href="/reminders"
              className="text-teal-600 text-sm font-medium hover:text-teal-700"
            >
              View all
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {visibleReminders.map((reminder) => (
              <Link
                key={reminder.id}
                href={`/pets/${reminder.petId}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-gray-100">
                    {reminder.petImage ? (
                      <Image
                        src={reminder.petImage}
                        alt={reminder.petName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🐾
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {reminder.petName}
                    </h3>
                    <p className="text-sm text-teal-600 font-medium truncate">
                      {formatReminderType(reminder.type)}
                    </p>
                    <p
                      className={`text-sm font-semibold mt-0.5 ${
                        reminder.isOverdue ? "text-red-600" : "text-teal-600"
                      }`}
                    >
                      {reminder.isOverdue
                        ? "⚠️ OVERDUE"
                        : formatDueDate(reminder.dueDate)}
                      {!reminder.isOverdue && reminder.dueTime && (
                        <span className="text-gray-500">
                          {" "}
                          • {reminder.dueTime}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        reminder.priority === "critical" ||
                        reminder.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : reminder.priority === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {reminder.priority.charAt(0).toUpperCase() +
                        reminder.priority.slice(1)}
                    </span>

                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <div className="px-5 pt-6">
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3">
            <p className="text-sm text-teal-800">
              Browsing as guest. Sign in to manage pets, reminders, bookings,
              and messages.
            </p>
            <Link
              href="/login"
              className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      <PetServices />
      <MarketplaceBanner />
      <LostAndFound />
    </MobileLayout>
  );
}
