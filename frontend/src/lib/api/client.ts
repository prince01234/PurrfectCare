import Cookies from "js-cookie";

// For phone testing, set NEXT_PUBLIC_API_URL in .env.local to your machine's IP
// Example: NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  errorCode?: string;
}

// Helper to get auth token — try cookie first, fall back to localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Use js-cookie for consistent reading (matches how AuthContext sets it)
  const token = Cookies.get("authToken");
  if (token) return token;
  // Fallback to localStorage if cookie was lost (e.g. browser cleared cookies)
  return localStorage.getItem("authToken");
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
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

// Helper to check if error is verification required
export const isVerificationError = (errorCode?: string) =>
  errorCode === "EMAIL_NOT_VERIFIED";
