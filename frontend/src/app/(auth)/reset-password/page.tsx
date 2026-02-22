"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const isLinkMode = Boolean(userId && token);

  const linkForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmitLink = async (data: ResetPasswordFormData) => {
    if (!userId || !token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);

    const response = await authApi.resetPassword(
      userId,
      token,
      data.password,
      data.confirmPassword,
    );

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    toast.success("Password reset successfully!");
    setIsSuccess(true);
    setIsLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  if (isSuccess) {
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
            Password Reset!
          </h1>
          <p className="text-gray-500 mb-8">
            Your password has been successfully reset. You will be redirected to
            login shortly.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  if (!isLinkMode) {
    return (
      <AuthLayout variant="login">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Invalid Reset Link
          </h1>
          <p className="text-gray-500 mb-8">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link href="/forgot-password">
            <Button>Request New Code</Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="login">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
          Reset Password
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Enter your new password below
        </p>
        <form
          onSubmit={linkForm.handleSubmit(onSubmitLink)}
          className="space-y-5"
        >
          <Input
            label="New Password"
            icon={Lock}
            type="password"
            placeholder="Enter new password"
            error={linkForm.formState.errors.password?.message}
            {...linkForm.register("password")}
          />

          <Input
            label="Confirm New Password"
            icon={Lock}
            type="password"
            placeholder="Confirm new password"
            error={linkForm.formState.errors.confirmPassword?.message}
            {...linkForm.register("confirmPassword")}
          />

          <Button type="submit" isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
