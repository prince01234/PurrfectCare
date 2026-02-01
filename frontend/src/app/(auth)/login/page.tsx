"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SocialButton from "@/components/ui/SocialButton";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    const response = await authApi.login(data.email, data.password);

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    if (response.data) {
      login(
        {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isVerified: response.data.isVerified,
          hasCompletedOnboarding: response.data.hasCompletedOnboarding,
          userIntent: response.data.userIntent as
            | "pet_owner"
            | "looking_to_adopt"
            | "exploring"
            | null,
        },
        response.data.authToken,
      );
      toast.success(`Welcome back, ${response.data.name}!`);

      // Redirect based on onboarding status
      if (!response.data.hasCompletedOnboarding) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }

    setIsLoading(false);
  };

  return (
    <AuthLayout variant="login">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-500 text-center mb-8">Login to PurrfectCare</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email or Phone"
            icon={Mail}
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-violet-600 font-medium text-sm hover:text-violet-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading}>
            Login
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-violet-600 font-semibold hover:text-violet-700 transition-colors"
          >
            Sign up
          </Link>
        </p>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              or continue with
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <SocialButton
            provider="google"
            onClick={() => toast("Google login coming soon!", { icon: "🚧" })}
          />
          <SocialButton
            provider="facebook"
            onClick={() => toast("Facebook login coming soon!", { icon: "🚧" })}
          />
          <SocialButton
            provider="apple"
            onClick={() => toast("Apple login coming soon!", { icon: "🚧" })}
          />
        </div>
      </motion.div>
    </AuthLayout>
  );
}
