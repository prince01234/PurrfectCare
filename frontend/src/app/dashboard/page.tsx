"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertTriangle, Calendar, Pill, Syringe, Clock } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/lib/api";
import type { Pet, Reminder, HealthOverview } from "@/lib/api";
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
  dueTime: string;
  priority: string;
  isOverdue: boolean;
}

// Mock lost/found data (can be replaced with API later)
const mockLostFound = [
  {
    id: "1",
    type: "lost" as const,
    petName: "Rusty",
    description:
      "Wearing a blue collar. Friendly but scared. Last seen near the park entrance.",
    location: "Central Park Area",
    date: "Feb 1, 2026",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    type: "found" as const,
    petName: "Unknown Cat",
    description:
      "Found near the lake. Very small. No collar. Needs a home urgently.",
    location: "Riverside District",
    date: "Yesterday",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop",
  },
];

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
  const router = useRouter();
  const [pets, setPets] = useState<DisplayPet[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<
    UpcomingReminder[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or onboarding not completed
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && user && !user.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [user, authLoading, router]);

  // Fetch pets and their reminders
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const petsRes = await petApi.getPets({ limit: 100 });

        if (!petsRes.data?.pets) {
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
        setPets(displayPets);

        console.log(
          `%c✓ Fetched ${allPets.length} pets`,
          "color: green; font-weight: bold",
        );

        // Fetch reminders for each pet and collect all upcoming ones
        const allReminders: UpcomingReminder[] = [];

        for (const pet of allPets) {
          try {
            // Use dedicated reminders endpoint instead of health overview
            const remindersRes = await petApi.getReminders(pet._id);
            console.log(
              `%c→ Fetching reminders for ${pet.name}`,
              "color: blue",
              remindersRes,
            );

            if (
              remindersRes.data?.reminders &&
              Array.isArray(remindersRes.data.reminders)
            ) {
              console.log(
                `%c  Found ${remindersRes.data.reminders.length} total reminders`,
                "color: blue",
              );

              const petReminders = remindersRes.data.reminders
                .filter(
                  (reminder: Reminder) =>
                    reminder.status === "active" ||
                    reminder.status === "snoozed",
                )
                .map((reminder: Reminder) => ({
                  id: reminder._id,
                  petId: pet._id,
                  petName: pet.name,
                  petImage: pet.photos?.[0] || null,
                  title: reminder.title,
                  type: reminder.reminderType,
                  dueDate: reminder.dueDate,
                  dueTime: reminder.dueTime,
                  priority: reminder.priority,
                  isOverdue:
                    new Date(reminder.dueDate) < new Date() &&
                    reminder.status === "active",
                }));
              console.log(
                `%c  Added ${petReminders.length} active reminders from ${pet.name}`,
                "color: green",
              );
              allReminders.push(...petReminders);
            } else if (remindersRes.error) {
              console.warn(
                `%c✗ Error fetching reminders for ${pet.name}: ${remindersRes.error}`,
                "color: orange",
              );
            }
          } catch (error) {
            console.error(
              `Failed to fetch reminders for pet ${pet._id}:`,
              error,
            );
          }
        }

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

        console.log(
          `%c✓ FINAL: ${allReminders.length} reminders to display`,
          "color: green; font-weight: bold",
          allReminders,
        );

        // Keep top 5 most urgent reminders
        setUpcomingReminders(allReminders.slice(0, 5));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  // Update the most urgent pet with its reminder info
  if (mostUrgentPet && mostUrgentReminder) {
    mostUrgentPet.nextVetDate = formatDueDate(mostUrgentReminder.dueDate);
  }

  return (
    <MobileLayout>
      <HeroSection userName={user.name} />

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
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                {mostUrgentPet.image ? (
                  <img
                    src={mostUrgentPet.image}
                    alt={mostUrgentPet.name}
                    className="w-full h-full object-cover"
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
                    : mostUrgentPet.nextVetDate}
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
      <LostAndFound posts={mockLostFound} />
    </MobileLayout>
  );
}
