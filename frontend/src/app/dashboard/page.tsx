"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { AlertTriangle, Calendar, Pill, Syringe, Clock } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationCenterContext";
import { petApi } from "@/lib/api";
import type { Pet, Reminder } from "@/lib/api";
import MobileLayout from "@/components/layout/MobileLayout";
import HeroSection from "@/components/home/HeroSection";
import PetServices from "@/components/home/PetServices";
import MarketplaceBanner from "@/components/home/MarketplaceBanner";
import LostAndFound from "@/components/home/LostAndFound";

interface DisplayPet {
  id: string;
  name: string;
  image: string | null;
  nextVetDate: string | null;
}

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

// Mock data replaced with real API in LostAndFound component

function getReminderIcon(type: string) {
  switch (type) {
    case "vaccination_due":
      return <Syringe className="w-4 h-4" />;
    case "medication":
      return <Pill className="w-4 h-4" />;
    case "vet_checkup":
      return <Calendar className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

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
  const [pets, setPets] = useState<DisplayPet[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<
    UpcomingReminder[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or onboarding not completed
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
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
            setPets([]);
            setUpcomingReminders([]);
          }
          setIsLoading(false);
          return;
        }

        const allPets = petsRes.data.pets;
        const displayPets: DisplayPet[] = allPets.map((pet: Pet) => ({
          id: pet._id,
          name: pet.name,
          image: pet.photos?.[0] || null,
          nextVetDate: null,
        }));

        const petById = new Map(
          allPets.map((pet: Pet) => [
            pet._id,
            { name: pet.name, image: pet.photos?.[0] || null },
          ]),
        );

        const reminders = Array.isArray(remindersRes.data)
          ? remindersRes.data
          : [];

        const allReminders: UpcomingReminder[] = reminders
          .filter(
            (reminder: Reminder) =>
              (reminder.status === "active" || reminder.status === "snoozed") &&
              Boolean(petById.get(reminder.petId)),
          )
          .map((reminder: Reminder) => {
            const petMeta = petById.get(reminder.petId)!;
            return {
              id: reminder._id,
              petId: reminder.petId,
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
          });

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
          setPets(displayPets);
          setUpcomingReminders(allReminders.slice(0, 5));
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

  if (authLoading || isLoading) {
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

  if (!user) return null;

  // Get the pet with the most urgent reminder
  const mostUrgentReminder = upcomingReminders[0];
  const mostUrgentPet = mostUrgentReminder
    ? pets.find((p) => p.id === mostUrgentReminder.petId)
    : null;
  const mostUrgentDueText = mostUrgentReminder
    ? formatDueDate(mostUrgentReminder.dueDate)
    : null;

  return (
    <MobileLayout>
      <HeroSection
        userName={user.name}
        notificationCount={unreadCount}
        onNotificationClick={openSheet}
      />

      {/* Most Urgent Pet Card */}
      {mostUrgentPet && (
        <div className="px-5 py-6">
          <Link href={`/pets/${mostUrgentPet.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
            >
              {/* Pet Image */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 bg-gray-100">
                {mostUrgentPet.image ? (
                  <Image
                    src={mostUrgentPet.image}
                    alt={mostUrgentPet.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🐾
                  </div>
                )}
              </div>

              {/* Pet Info */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {mostUrgentPet.name}
                </h3>
                <p className="text-sm text-teal-600 font-medium">
                  Next: {mostUrgentReminder?.title}
                </p>
                <p
                  className={`text-sm font-semibold mt-1 ${
                    mostUrgentReminder?.isOverdue
                      ? "text-red-600"
                      : "text-teal-600"
                  }`}
                >
                  {mostUrgentReminder?.isOverdue
                    ? "⚠️ OVERDUE"
                    : mostUrgentDueText}
                </p>
              </div>

              {/* Arrow */}
              <div className="text-gray-400">
                <svg
                  className="w-5 h-5"
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
        </div>
      )}

      {/* Upcoming Reminders Section */}
      {upcomingReminders.length > 0 && (
        <div className="px-5 py-6">
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

          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  reminder.isOverdue
                    ? "bg-red-50 border-red-200"
                    : "bg-teal-50 border-teal-200"
                } flex items-start gap-4`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 p-2 rounded-lg ${
                    reminder.isOverdue
                      ? "bg-red-100 text-red-600"
                      : "bg-teal-100 text-teal-600"
                  }`}
                >
                  {reminder.isOverdue ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    getReminderIcon(reminder.type)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {reminder.petName}
                  </p>
                  <p
                    className={`text-xs font-medium mt-1 ${
                      reminder.isOverdue ? "text-red-600" : "text-teal-600"
                    }`}
                  >
                    {reminder.isOverdue
                      ? "OVERDUE"
                      : formatDueDate(reminder.dueDate)}{" "}
                    {!reminder.isOverdue && reminder.dueTime && (
                      <span className="text-gray-500">
                        • {reminder.dueTime}
                      </span>
                    )}
                  </p>
                </div>

                {/* Priority Badge */}
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      reminder.priority === "critical" ||
                      reminder.priority === "high"
                        ? "bg-red-200 text-red-800"
                        : reminder.priority === "medium"
                          ? "bg-orange-200 text-orange-800"
                          : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {reminder.priority.charAt(0).toUpperCase() +
                      reminder.priority.slice(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <PetServices />
      <MarketplaceBanner />
      <LostAndFound />
    </MobileLayout>
  );
}
