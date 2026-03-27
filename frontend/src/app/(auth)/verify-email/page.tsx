"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OTPInput from "@/components/ui/OTPInput";
import { authApi } from "@/lib/api";
import { verifyEmailSchema, VerifyEmailFormData } from "@/lib/validations";

function VerifyEmailContent() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
    },
  });

  const otpValue = watch("otp");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const verifyEmail = async () => {
      if (!userId || !token) {
        setStatus("idle");
        return;
      }

      setStatus("loading");
      const response = await authApi.verifyEmail(userId, token);

      if (response.error) {
        setStatus("error");
        setMessage(response.error);
        toast.error(response.error);
        return;
      }

      setStatus("success");
      setMessage(response.data?.message || "Email verified successfully!");
      toast.success("Email verified successfully!");
    };

    verifyEmail();
  }, [userId, token, mounted]);

  useEffect(() => {
    if (emailParam && mounted) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue, mounted]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsSubmitting(true);
    const response = await authApi.verifyEmailWithOtp(data.email, data.otp);

    if (response.error) {
      toast.error(response.error);
      setStatus("idle");
      setIsSubmitting(false);
      return;
    }

    setStatus("success");
    setMessage(response.data?.message || "Email verified successfully!");
    toast.success("Email verified successfully!");
    setIsSubmitting(false);
  };

  if (status === "loading") {
    return (
      <AuthLayout variant="login">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-violet-500" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-2 text-center">
            Verifying Your Email
          </h1>
          <p className="text-sm sm:text-base text-gray-600 text-center">
            Please wait while we verify your email address...
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout variant="login">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col h-full justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
            Verification Failed
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-8 text-center leading-relaxed">
            {message}
          </p>
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full h-11 sm:h-10 text-base font-medium">
                Try Again
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button
                variant="outline"
                className="w-full h-11 sm:h-10 text-base font-medium"
              >
                Sign Up Again
              </Button>
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  if (status === "idle") {
    return (
      <AuthLayout variant="login">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col h-full justify-center"
        >
          {/* Header Section */}
          <div className="mb-6 md:mb-8 pt-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.1,
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm border border-violet-100"
            >
              <CheckCircle
                className="w-7 h-7 sm:w-8 sm:h-8 text-violet-600"
                strokeWidth={2.5}
              />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-1 sm:mb-2 tracking-tight">
              Verify your email
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 text-center max-w-sm mx-auto">
              We've sent a 6-digit verification code to the email address you
              provided.
            </p>
          </div>

          {/* Form Section */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6 w-full max-w-sm mx-auto"
          >
            {/* Email Input */}
            <div className="space-y-1">
              <Input
                label="Email address"
                type="email"
                placeholder="yours@example.com"
                error={errors.email?.message}
                {...register("email")}
                className="text-sm sm:text-base shadow-sm"
              />
            </div>

            {/* OTP Input */}
            <div className="space-y-1 sm:space-y-2 pt-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Verification code
                </label>
              </div>
              <OTPInput
                value={otpValue}
                onChange={(value) => setValue("otp", value)}
                error={errors.otp?.message}
              />
            </div>

            {/* Verify Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2 sm:pt-4"
            >
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-sm rounded-xl"
              >
                {isSubmitting ? "Verifying..." : "Verify email"}
              </Button>
            </motion.div>
          </form>

          {/* Footer Section */}
          <div className="text-center pt-6 sm:pt-8">
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              Didn't receive the code? Check spam or
            </p>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium rounded-xl hover:bg-gray-50 max-w-sm mx-auto"
              >
                Back to sign in
              </Button>
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="login">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full justify-center items-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Email Verified!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>
        <Link href="/login" className="w-full sm:w-auto">
          <Button className="w-full sm:w-48 h-11 text-base font-medium">
            Continue to Login
          </Button>
        </Link>
      </motion.div>
    </AuthLayout>
  );
}

function LoadingFallback() {
  return (
    <AuthLayout variant="login">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
