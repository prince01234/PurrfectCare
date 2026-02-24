import { apiRequest } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{
      _id: string;
      name: string;
      email: string;
      authToken: string;
      isVerified: boolean;
      hasCompletedOnboarding: boolean;
      userIntent: string | null;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) =>
    apiRequest<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (
    userId: string,
    token: string,
    password: string,
    confirmPassword: string,
  ) =>
    apiRequest<{ message: string }>(
      `/api/auth/reset-password?userId=${userId}&token=${token}`,
      {
        method: "POST",
        body: JSON.stringify({ password, confirmPassword }),
      },
    ),

  verifyResetOtp: (email: string, otp: string) =>
    apiRequest<{ userId: string; token: string }>(
      "/api/auth/verify-reset-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      },
    ),

  verifyEmail: (userId: string, token: string) =>
    apiRequest<{ message: string }>(
      `/api/auth/verify-email?userId=${userId}&token=${token}`,
      {
        method: "POST",
      },
    ),

  verifyEmailWithOtp: (email: string, otp: string) =>
    apiRequest<{ message: string }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resendVerification: (email: string) =>
    apiRequest<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPasswordWithOtp: (
    email: string,
    otp: string,
    password: string,
    confirmPassword: string,
  ) =>
    apiRequest<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password, confirmPassword }),
    }),
};
