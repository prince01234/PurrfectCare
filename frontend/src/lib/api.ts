// For phone testing, set NEXT_PUBLIC_API_URL in .env.local to your machine's IP
// Example: NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Something went wrong" };
    }

    return { data };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ _id: string; name: string; email: string; authToken: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),

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

  verifyEmail: (userId: string, token: string) =>
    apiRequest<{ message: string }>(
      `/api/auth/verify-email?userId=${userId}&token=${token}`,
      {
        method: "POST",
      },
    ),

  resendVerification: (email: string) =>
    apiRequest<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

export default apiRequest;
