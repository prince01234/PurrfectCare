import { apiRequest, getAuthToken, API_URL } from "./client";

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
      true,
    ),

  getUserById: (userId: string) =>
    apiRequest<{
      _id: string;
      name: string;
      email: string;
      hasCompletedOnboarding: boolean;
      userIntent: string | null;
      profileImage?: string;
    }>(
      `/api/users/${userId}`,
      {
        method: "GET",
      },
      true,
    ),

  updateUser: async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      profilePicture?: File;
    },
  ) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.email) formData.append("email", data.email);
    if (data.profilePicture)
      formData.append("profileImage", data.profilePicture);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers,
        body: formData,
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) {
        return { error: result.error || result.message || "Failed to update" };
      }
      return { data: result };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  },
};
