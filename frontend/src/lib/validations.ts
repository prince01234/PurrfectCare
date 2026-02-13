import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordOtpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordOtpOnlySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordOtpFormData = z.infer<typeof resetPasswordOtpSchema>;
export type ResetPasswordOtpOnlyFormData = z.infer<
  typeof resetPasswordOtpOnlySchema
>;
