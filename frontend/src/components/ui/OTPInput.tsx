"use client";

import React, { useRef, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const OTPInput = forwardRef<HTMLInputElement, OTPInputProps>(
  ({ length = 6, value, onChange, error }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, []);

    const handleChange = (index: number, digit: string) => {
      // Only allow digits
      if (!/^\d*$/.test(digit)) return;

      const newOtp = value.split("");
      newOtp[index] = digit;
      const newValue = newOtp.join("").slice(0, length);
      onChange(newValue);

      // Auto-focus next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const newOtp = value.split("");
        newOtp[index] = "";
        onChange(newOtp.join("").slice(0, index));

        // Focus previous input if current is empty
        if (!value[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        } else if (value[index] && inputRefs.current[index]) {
          // Clear current and stay focused
          inputRefs.current[index]!.value = "";
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const digits = pastedData.replace(/\D/g, "").slice(0, length);
      onChange(digits);

      // Focus last input
      setTimeout(() => {
        const focusIndex = Math.min(digits.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    };

    return (
      <div className="w-full">
        <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-[320px] mx-auto">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
                // Expose the first input's ref if a ref is forwarded to the OTPInput component
                if (index === 0 && ref) {
                  if (typeof ref === "function") {
                    ref(el);
                  } else {
                    ref.current = el;
                  }
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-full aspect-square text-center text-xl sm:text-2xl font-semibold rounded-xl border-2 transition-all outline-none flex items-center justify-center shadow-sm ${
                error
                  ? "border-red-300 text-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 bg-red-50/30"
                  : "border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-4 focus:ring-violet-100/50 bg-gray-50/50 focus:bg-white"
              } hover:border-gray-300`}
              disabled={false}
            />
          ))}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 ml-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  },
);

OTPInput.displayName = "OTPInput";

export default OTPInput;
