"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, ShieldAlert } from "lucide-react";
import Button from "./Button";

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResendEmail?: () => void;
  isResending?: boolean;
  userEmail?: string;
}

export default function VerificationRequiredModal({
  isOpen,
  onClose,
  onResendEmail,
  isResending = false,
  userEmail,
}: VerificationRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldAlert className="w-10 h-10 text-amber-500" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verification Required
                </h2>
                <p className="text-gray-500">
                  Please verify your email address to perform this action. Check
                  your inbox for the verification link.
                </p>
                {userEmail && (
                  <p className="text-sm text-gray-400 mt-2">
                    Sent to: <span className="font-medium">{userEmail}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {onResendEmail && (
                  <Button
                    onClick={onResendEmail}
                    isLoading={isResending}
                    className="bg-linear-to-r! from-amber-400! to-orange-400! shadow-amber-200!"
                  >
                    <Mail className="w-5 h-5" />
                    Resend Verification Email
                  </Button>
                )}
                <Button variant="secondary" onClick={onClose}>
                  I&apos;ll do it later
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Can&apos;t find the email? Check your spam folder.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
