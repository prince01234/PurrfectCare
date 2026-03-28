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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorText = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) return fallback;

  const error = payload.error;
  if (typeof error === "string" && error.trim()) return error;

  const message = payload.message;
  if (typeof message === "string" && message.trim()) return message;

  return fallback;
};

const getErrorCode = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;
  const code = payload.code;
  return typeof code === "string" ? code : undefined;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
};

export const parseApiResponse = async <T>(
  response: Response,
  fallbackError: string = "Something went wrong",
): Promise<ApiResponse<T>> => {
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    return {
      error: getErrorText(payload, fallbackError),
      errorCode: getErrorCode(payload),
    };
  }

  return { data: payload as T };
};

export const getFetchErrorMessage = (
  error: unknown,
  fallback: string = "Network error. Please try again.",
): string => {
  if (error instanceof Error && error.message) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return "Request blocked or unreachable. Check deployment URL/CORS and try again.";
    }

    return error.message;
  }

  return fallback;
};

// Helper to get optional bearer token fallback.
// Primary auth uses httpOnly cookies sent automatically with credentials.
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false,
): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(options.headers || undefined);

    // Add auth token if required or available
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // Add JSON content type only when request has string body and no explicit content type.
    if (
      options.body != null &&
      typeof options.body === "string" &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    return parseApiResponse<T>(response);
  } catch (error) {
    return { error: getFetchErrorMessage(error) };
  }
}

// Helper to check if error is verification required
export const isVerificationError = (errorCode?: string) =>
  errorCode === "EMAIL_NOT_VERIFIED";
