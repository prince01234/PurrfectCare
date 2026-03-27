import Cookies from "js-cookie";

// Get API URL from environment variable
// For production (Vercel): NEXT_PUBLIC_API_URL must be set to Render backend URL
// For local development: set in .env.local
function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback for local development only
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }

  throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

export const API_URL = getApiUrl();

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  errorCode?: string;
}

// Helper to get auth token from cookie (for Bearer header if needed)
// Note: Token is primarily stored in httpOnly cookie and sent automatically
// This is mainly for manual header construction in edge cases
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Only check cookie - no localStorage fallback (secure cookie-based auth only)
  return Cookies.get("authToken") || null;
};

export async function apiRequest<T>(
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
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || data.message || "Something went wrong",
        errorCode: data.code,
      };
    }

    return { data };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

// Helper to check if error is verification required
export const isVerificationError = (errorCode?: string) =>
  errorCode === "EMAIL_NOT_VERIFIED";
