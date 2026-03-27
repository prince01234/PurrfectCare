"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  apiRequest,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  roles?: "USER" | "PET_OWNER" | "ADMIN" | "SUPER_ADMIN";
  serviceType?: string;
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  userIntent?: "pet_owner" | "looking_to_adopt" | "exploring" | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<User>;
  return (
    typeof candidate._id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, verify authentication via /api/auth/me
    // The httpOnly cookie is sent automatically; bearer token fallback is used when needed.
    const verifyAuth = async () => {
      try {
        const response = await apiRequest<User>("/auth/me", {}, true);

        if (isUser(response.data)) {
          setUser(response.data);
          setToken(getAuthToken() ?? "authenticated");
        } else {
          clearAuthToken();
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Accept optional token (for compatibility)
  // Token is actually stored in httpOnly cookie by backend
  const login = (userData: User, authToken?: string | null) => {
    setUser(userData);
    if (authToken) {
      setAuthToken(authToken);
      setToken(authToken);
      return;
    }

    setToken(getAuthToken() ?? "authenticated");
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      clearAuthToken();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
