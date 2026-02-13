"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

export default function Button({
  isLoading,
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-[0.98]",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98]",
    outline:
      "border-2 border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 active:scale-[0.98]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
