"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  roles?: "USER" | "PET_OWNER" | "ADMIN" | "SUPER_ADMIN";
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  authToken?: string;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processOAuthToken = async () => {
      try {
        const provider = searchParams.get("provider");
        const error = searchParams.get("error");

        if (error) {
          toast.error("OAuth authentication failed. Please try again.");
          router.push("/login");
          return;
        }

        // Verify user is authenticated by calling /api/auth/me
        // The httpOnly cookie is automatically sent with this request
        const response = await apiRequest<User>("/api/auth/me");

        if (response.error || !response.data) {
          toast.error("Authentication verification failed. Please try again.");
          router.push("/login");
          return;
        }

        const userData = response.data;

        // Login user with data from /api/auth/me
        // Pass authToken if returned (for cross-origin cookie fallback)
        login(userData, userData.authToken || null);

        toast.success(`Welcome ${userData.name}! Logged in via ${provider}`);

        if (!userData.hasCompletedOnboarding) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        toast.error("An error occurred during login. Please try again.");
        router.push("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthToken();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isProcessing ? "Completing authentication..." : "Redirecting..."}
        </h2>
        <p className="text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completing authentication...
            </h2>
            <p className="text-gray-600">Please wait while we log you in.</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
