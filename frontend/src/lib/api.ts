// For phone testing, set NEXT_PUBLIC_API_URL in .env.local to your machine's IP
// Example: NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  errorCode?: string;
}

// Helper to get auth token from cookies
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "authToken") {
      return value;
    }
  }
  return null;
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false,
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if required or available
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies in request
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || data.message || "Something went wrong",
        errorCode: data.code,
      };
    }

    return { data };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

// Helper to check if error is verification required
export const isVerificationError = (errorCode?: string) =>
  errorCode === "EMAIL_NOT_VERIFIED";

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

export const userApi = {
  completeOnboarding: (userId: string, userIntent?: string) =>
    apiRequest<{
      message: string;
      user: {
        _id: string;
        name: string;
        email: string;
        hasCompletedOnboarding: boolean;
        userIntent: string | null;
      };
    }>(
      `/api/users/${userId}/onboarding`,
      {
        method: "POST",
        body: JSON.stringify({ userIntent }),
      },
      true, // requires auth
    ),

  getUserById: (userId: string) =>
    apiRequest<{
      _id: string;
      name: string;
      email: string;
      hasCompletedOnboarding: boolean;
      userIntent: string | null;
    }>(
      `/api/users/${userId}`,
      {
        method: "GET",
      },
      true, // requires auth
    ),
};

export default apiRequest;
