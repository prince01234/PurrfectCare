"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processOAuthToken = async () => {
      try {
        const token = searchParams.get("token");
        const provider = searchParams.get("provider");
        const error = searchParams.get("error");

        if (error) {
          toast.error("OAuth authentication failed. Please try again.");
          router.push("/login");
          return;
        }

        if (!token) {
          toast.error("No authentication token received.");
          router.push("/login");
          return;
        }

        // Store token in cookie
        Cookies.set("authToken", token, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
        });

        // Also store in localStorage as fallback
        localStorage.setItem("authToken", token);

        // Decode JWT to get user data (simple base64 decode, not full verification)
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            // Decode base64 safely for browser
            const decoded = JSON.parse(
              decodeURIComponent(
                atob(parts[1])
                  .split("")
                  .map((c) => {
                    return (
                      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                  })
                  .join(""),
              ),
            );

            // User data is stored in the JWT payload
            const userData = {
              _id: decoded._id || decoded.id,
              name: decoded.name,
              email: decoded.email,
              isVerified: decoded.isVerified || true, // OAuth users auto-verified
              hasCompletedOnboarding: decoded.hasCompletedOnboarding || false,
              userIntent: decoded.userIntent || null,
            };

            // Login the user
            login(userData, token);

            toast.success(
              `Welcome ${userData.name}! Logged in via ${provider}`,
            );

            // Redirect based on onboarding status
            if (!userData.hasCompletedOnboarding) {
              router.push("/onboarding");
            } else {
              router.push("/dashboard");
            }
          } else {
            throw new Error("Invalid token format");
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_decodeError) {
          // If token decode fails, still redirect to dashboard
          // The token is already stored and will be used for API calls
          toast.success("Authentication successful!");
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
