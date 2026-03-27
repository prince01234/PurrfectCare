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
    <div className="min-h-screen w-full bg-slate-50" suppressHydrationWarning>
      <div
        className="mx-auto w-full max-w-md px-5 py-8 sm:py-10"
        suppressHydrationWarning
      >
        <div data-variant={variant} suppressHydrationWarning>
          {children}
        </div>
      </div>
    </div>
  );
}
