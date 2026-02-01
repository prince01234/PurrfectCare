"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, User, PawPrint, ShieldCheck, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import VerificationRequiredModal from "@/components/ui/VerificationRequiredModal";
import { useVerification } from "@/lib/hooks/useVerification";

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const {
    showVerificationModal,
    closeVerificationModal,
    resendVerificationEmail,
    isResendingEmail,
    requiresVerification,
  } = useVerification();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    // Redirect to onboarding if not completed
    if (!isLoading && user && !user.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  // Handler for actions that require verification
  const handleProtectedAction = (actionName: string, actionIcon: string) => {
    if (requiresVerification()) {
      return; // Modal will be shown by the hook
    }
    // If verified, proceed with action
    toast(`${actionName} feature coming soon!`, { icon: actionIcon });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Verification Modal */}
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={closeVerificationModal}
        onResendEmail={resendVerificationEmail}
        isResending={isResendingEmail}
        userEmail={user.email}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <PawPrint className="w-8 h-8 text-violet-600" />
            <h1 className="text-xl md:text-2xl font-bold text-violet-600">
              PurrfectCare
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <span className="text-gray-600 hidden sm:block">
              Welcome, <span className="font-semibold">{user.name}</span>
            </span>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="!w-auto !py-2 !px-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Verification Banner */}
      {!user.isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">Email not verified.</span>{" "}
                <span className="hidden sm:inline">
                  Verify your email to add pets, book services, and more.
                </span>
              </p>
            </div>
            <button
              onClick={resendVerificationEmail}
              disabled={isResendingEmail}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 whitespace-nowrap disabled:opacity-50"
            >
              {isResendingEmail ? "Sending..." : "Resend Email"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8"
        >
          {/* User Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-violet-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg relative"
            >
              <User className="w-10 h-10 text-white" />
              {/* Verification Badge */}
              <div
                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center ${
                  user.isVerified ? "bg-green-500" : "bg-amber-500"
                }`}
              >
                {user.isVerified ? (
                  <ShieldCheck className="w-4 h-4 text-white" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-white" />
                )}
              </div>
            </motion.div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${
                  user.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {user.isVerified ? (
                  <>
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3" /> Unverified
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 rounded-2xl p-6 text-white mb-6"
          >
            <h3 className="text-xl md:text-2xl font-semibold mb-2">
              🎉 Welcome to PurrfectCare!
            </h3>
            <p className="opacity-90">
              Your account has been set up successfully. Start exploring
              features to manage your pet&apos;s care routine.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
              {!user.isVerified && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Verification required for some actions)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: "🐱",
                  label: "Add Pet",
                  color: "from-pink-400 to-rose-400",
                  requiresVerification: true,
                },
                {
                  icon: "📅",
                  label: "Schedule",
                  color: "from-blue-400 to-cyan-400",
                  requiresVerification: true,
                },
                {
                  icon: "💊",
                  label: "Medications",
                  color: "from-green-400 to-emerald-400",
                  requiresVerification: true,
                },
                {
                  icon: "📊",
                  label: "Health Log",
                  color: "from-orange-400 to-amber-400",
                  requiresVerification: false, // View-only action
                },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (action.requiresVerification) {
                      handleProtectedAction(action.label, action.icon);
                    } else {
                      toast(`${action.label} feature coming soon!`, {
                        icon: action.icon,
                      });
                    }
                  }}
                  className={`bg-gradient-to-br ${action.color} p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow relative`}
                >
                  {action.requiresVerification && !user.isVerified && (
                    <div className="absolute top-2 right-2">
                      <ShieldAlert className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                  <span className="text-3xl mb-2 block">{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
