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
import { authApi } from "@/lib/api";
import { verifyEmailSchema, VerifyEmailFormData } from "@/lib/validations";

function VerifyEmailContent() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
    },
  });

  useEffect(() => {
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
  }, [userId, token]);

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

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
          className="text-center py-8"
        >
          <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Verifying Your Email
          </h1>
          <p className="text-gray-500">
            Please wait while we verify your email...
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
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Verification Failed
          </h1>
          <p className="text-gray-500 mb-8">{message}</p>
          <div className="space-y-4">
            <Link href="/login">
              <Button>Go to Login</Button>
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
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Enter the 6-digit code we sent to your email
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Verification Code"
              type="text"
              placeholder="123456"
              error={errors.otp?.message}
              {...register("otp")}
            />

            <Button type="submit" isLoading={isSubmitting}>
              Verify Email
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link href="/login">
              <Button variant="outline">Back to Login</Button>
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
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Email Verified!
        </h1>
        <p className="text-gray-500 mb-8">{message}</p>
        <Link href="/login">
          <Button>Continue to Login</Button>
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
