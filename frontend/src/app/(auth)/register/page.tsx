"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SocialButton from "@/components/ui/SocialButton";
import { registerSchema, RegisterFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    const response = await authApi.register(
      data.name,
      data.email,
      data.password,
      data.confirmPassword,
    );

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    if (response.data) {
      toast.success(
        response.data.message ||
          "Registration successful! Please check your email to verify your account.",
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }

    setIsLoading(false);
  };

  return (
    <AuthLayout variant="register">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
          Create Account
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Join PurrfectCare family today
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            icon={User}
            type="text"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-violet-600 font-semibold hover:text-violet-700 transition-colors"
          >
            Login
          </Link>
        </p>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <SocialButton
            provider="google"
            onClick={() => toast("Google signup coming soon!", { icon: "🚧" })}
          />
          <SocialButton
            provider="facebook"
            onClick={() =>
              toast("Facebook signup coming soon!", { icon: "🚧" })
            }
          />
          <SocialButton
            provider="apple"
            onClick={() => toast("Apple signup coming soon!", { icon: "🚧" })}
          />
        </div>
      </motion.div>
    </AuthLayout>
  );
}
