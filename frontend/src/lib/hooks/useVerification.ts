"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { authApi, isVerificationError } from "@/lib/api";

interface UseVerificationOptions {
  onVerificationRequired?: () => void;
}

export function useVerification(options: UseVerificationOptions = {}) {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const { user } = useAuth();

  const handleApiError = useCallback(
    (error: string | undefined, errorCode: string | undefined) => {
      if (isVerificationError(errorCode)) {
        setShowVerificationModal(true);
        options.onVerificationRequired?.();
        return true;
      }
      if (error) {
        toast.error(error);
      }
      return false;
    },
    [options],
  );

  const resendVerificationEmail = useCallback(async () => {
    const email = user?.email;
    if (!email) {
      toast.error("Email not found. Please login again.");
      return;
    }

    setIsResendingEmail(true);
    const response = await authApi.resendVerification(email);

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success("Verification email sent! Check your inbox.");
    }

    setIsResendingEmail(false);
  }, [user]);

  const closeVerificationModal = useCallback(() => {
    setShowVerificationModal(false);
  }, []);

  // Check if user needs verification before action
  const requiresVerification = useCallback(() => {
    if (user && !user.isVerified) {
      setShowVerificationModal(true);
      return true;
    }
    return false;
  }, [user]);

  return {
    showVerificationModal,
    setShowVerificationModal,
    isResendingEmail,
    handleApiError,
    resendVerificationEmail,
    closeVerificationModal,
    requiresVerification,
    isVerified: user?.isVerified ?? false,
  };
}
