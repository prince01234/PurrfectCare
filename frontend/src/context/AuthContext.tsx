"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { apiRequest } from "@/lib/api";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, verify authentication via /api/auth/me
    // The httpOnly cookie is automatically sent with the request
    const verifyAuth = async () => {
      try {
        // Check if there's an auth cookie
        if (Cookies.get("authToken")) {
          const response = await apiRequest("/auth/me");

          if (response.data) {
            setUser(response.data);
            // Token is in the httpOnly cookie, we don't need to store it
            setToken("authenticated");
          } else {
            // Cookie exists but user data fetch failed
            Cookies.remove("authToken", { path: "/" });
          }
        }
      } catch (error) {
        console.error("Auth verification error:", error);
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
    // Token value doesn't matter for cookie-based auth, marking as authenticated
    setToken(authToken ?? "authenticated");
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
      Cookies.remove("authToken", { path: "/" });
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
