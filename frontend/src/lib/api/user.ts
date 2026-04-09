import {
  apiRequest,
  getAuthToken,
  API_URL,
  getFetchErrorMessage,
  parseApiResponse,
} from "./client";

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
      phoneNumber?: string | null;
      mygc?: string | null;
      organizationName?: string | null;
      contactPhone?: string | null;
      contactAddress?: string | null;
      hasCompletedOnboarding: boolean;
      userIntent: string | null;
      profileImage?: string;
      latitude?: number | null;
      longitude?: number | null;
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
      phoneNumber?: string;
      mygc?: string;
      organizationName?: string;
      contactPhone?: string;
      contactAddress?: string;
      profilePicture?: File;
      latitude?: number;
      longitude?: number;
    },
  ) => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.email !== undefined) formData.append("email", data.email);
    if (data.phoneNumber !== undefined)
      formData.append("phoneNumber", data.phoneNumber);
    if (data.mygc !== undefined) formData.append("mygc", data.mygc);
    if (data.organizationName !== undefined)
      formData.append("organizationName", data.organizationName);
    if (data.contactPhone !== undefined)
      formData.append("contactPhone", data.contactPhone);
    if (data.contactAddress !== undefined)
      formData.append("contactAddress", data.contactAddress);
    if (data.profilePicture)
      formData.append("profileImage", data.profilePicture);
    if (data.latitude !== undefined)
      formData.append("latitude", String(data.latitude));
    if (data.longitude !== undefined)
      formData.append("longitude", String(data.longitude));

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

      return parseApiResponse(response, "Failed to update");
    } catch (error) {
      return {
        error: getFetchErrorMessage(error, "Update failed"),
      };
    }
  },
};
