"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  resetPasswordOtpOnlySchema,
  ResetPasswordOtpOnlyFormData,
} from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function ResetPasswordOtpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const otpLength = 6;
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: otpLength }, () => ""),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordOtpOnlyFormData>({
    resolver: zodResolver(resetPasswordOtpOnlySchema),
    defaultValues: {
      email: emailParam,
      otp: "",
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  useEffect(() => {
    setValue("otp", otpDigits.join(""), { shouldValidate: true });
  }, [otpDigits, setValue]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength);

    if (!pasted) return;

    const nextDigits = Array.from({ length: otpLength }, (_, idx) => {
      return pasted[idx] || "";
    });

    setOtpDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, otpLength - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = async (data: ResetPasswordOtpOnlyFormData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    const response = await authApi.verifyResetOtp(data.email, data.otp);

    if (response.error) {
      const message = response.error || "Invalid or expired reset code.";
      setErrorMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    const { userId, token } = response.data || {};
    if (!userId || !token) {
      const message = "Invalid reset response. Please request a new code.";
      setErrorMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    router.push(`/reset-password?userId=${userId}&token=${token}`);
  };

  return (
    <AuthLayout variant="login">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
          Enter Reset Code
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Enter the 6-digit code we sent to your email
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("email")} />
          <input type="hidden" {...register("otp")} />

          {!emailParam && (
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reset Code
            </label>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  value={digit}
                  onChange={(event) =>
                    handleOtpChange(index, event.target.value)
                  }
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                />
              ))}
            </div>
            {(errors.otp?.message || errorMessage) && (
              <p className="text-sm text-red-500 mt-2">
                {errors.otp?.message || errorMessage}
              </p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            Verify Code
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link href="/forgot-password">
            <Button variant="outline">
              <Lock className="w-4 h-4" />
              Request New Code
            </Button>
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
