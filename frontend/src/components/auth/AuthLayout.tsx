"use client";

import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: "login" | "register";
}

export default function AuthLayout({
  children,
  variant = "login",
}: AuthLayoutProps) {
  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center px-4 py-6 ${
        variant === "login"
          ? "bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100"
          : "bg-gradient-to-br from-orange-100 via-pink-50 to-cyan-100"
      }`}
    >
      {/* Centered Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
