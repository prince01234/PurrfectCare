"use client";

import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all bg-gray-50/50 ${
              error
                ? "border-red-300 focus-within:border-red-500"
                : isFocused
                  ? "border-violet-400 ring-2 ring-violet-100"
                  : "border-gray-200"
            }`}
          >
            {Icon && (
              <Icon
                className={`w-5 h-5 transition-colors flex-shrink-0 ${
                  error
                    ? "text-red-400"
                    : isFocused
                      ? "text-violet-500"
                      : "text-gray-400"
                }`}
              />
            )}
            <input
              ref={ref}
              type={inputType}
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-1.5 ml-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
