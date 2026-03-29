"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heart, Home, Compass, PawPrint } from "lucide-react";
import toast from "react-hot-toast";

import Button from "@/components/ui/Button";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingRedirectPath } from "@/lib/onboarding";

type UserIntent = "pet_owner" | "looking_to_adopt" | "exploring";

interface IntentOption {
  id: UserIntent;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const intentOptions: IntentOption[] = [
  {
    id: "pet_owner",
    title: "Yes, I have pets",
    description: "Tell us about your furry friends",
    icon: <Heart className="w-6 h-6" />,
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "looking_to_adopt",
    title: "Looking to adopt",
    description: "Find your perfect companion",
    icon: <Home className="w-6 h-6" />,
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "exploring",
    title: "Just exploring",
    description: "Browse and learn more",
    icon: <Compass className="w-6 h-6" />,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export default function OnboardingPage() {
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, updateUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Avoid overriding the intent redirect while completion request is in progress.
    if (!isLoading && user.hasCompletedOnboarding) {
      router.replace(getOnboardingRedirectPath(user.userIntent ?? null));
    }
  }, [user, authLoading, isLoading, router]);

  const handleContinue = async () => {
    if (!selectedIntent || !user) return;

    setIsLoading(true);
    try {
      const response = await userApi.completeOnboarding(
        user._id,
        selectedIntent,
      );

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        updateUser({
          hasCompletedOnboarding: true,
          userIntent: selectedIntent,
        });
        toast.success("Welcome to PurrfectCare!");

        // Route to appropriate page based on intent
        router.replace(getOnboardingRedirectPath(selectedIntent));
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await userApi.completeOnboarding(user._id);

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        updateUser({
          hasCompletedOnboarding: true,
          userIntent: null,
        });
        toast.success("Let's explore!");

        // Explorers go to dashboard
        router.replace(getOnboardingRedirectPath(null));
      }
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-teal-50 via-cyan-50/40 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-teal-50 via-cyan-50/30 to-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-6 max-w-md mx-auto w-full">
        {/* Paw Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-24 h-24 rounded-full bg-linear-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-200 mb-6"
        >
          <PawPrint className="w-12 h-12 text-white" />
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to
            <br />
            PurrfectCare
          </h1>
          <p className="text-gray-500">
            Answer a quick question to
            <br />
            personalize your experience
          </p>
        </motion.div>

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-gray-900 mb-6 text-center"
        >
          Do you currently have a pet?
        </motion.h2>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-3 mb-8"
        >
          <AnimatePresence>
            {intentOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => setSelectedIntent(option.id)}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  selectedIntent === option.id
                    ? "border-teal-300 bg-teal-50/60 shadow-md"
                    : "border-gray-100 bg-white/90 hover:border-teal-100 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full ${option.bgColor} flex items-center justify-center shrink-0`}
                >
                  <span className={option.iconColor}>{option.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedIntent === option.id
                      ? "border-teal-600 bg-teal-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedIntent === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-4"
        >
          <Button
            onClick={handleContinue}
            isLoading={isLoading}
            disabled={!selectedIntent}
            className={`${
              !selectedIntent
                ? "bg-linear-to-r! from-teal-300! to-emerald-300! shadow-none!"
                : "bg-linear-to-r! from-teal-500! to-emerald-500! shadow-lg! shadow-teal-200!"
            }`}
          >
            Continue
          </Button>

          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full py-3 text-gray-600 font-medium hover:text-teal-700 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>

          <p className="text-center text-sm text-gray-400">
            You can complete this anytime from your profile
          </p>
        </motion.div>
      </div>
    </div>
  );
}
