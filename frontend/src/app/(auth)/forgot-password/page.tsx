"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    const response = await authApi.forgotPassword(data.email);

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    toast.success("Reset code sent! Check your email.");
    setIsLoading(false);
    router.push(`/reset-password-otp?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <AuthLayout variant="login">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Forgot Password?
        </h1>
        <p className="text-gray-500 mb-8">
          No worries, we&apos;ll send you reset instructions.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Button type="submit" isLoading={isLoading}>
            Send Reset Code
          </Button>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
