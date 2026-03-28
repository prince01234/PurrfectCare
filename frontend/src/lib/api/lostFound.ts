import {
  apiRequest,
  API_URL,
  getAuthToken,
  getFetchErrorMessage,
  parseApiResponse,
} from "./client";
import type { ApiResponse } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostType = "lost" | "found";
export type PostStatus = "active" | "resolved";

export interface LostFoundPost {
  _id: string;
  postType: PostType;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    phoneNumber?: string;
  };
  title: string;
  description: string | null;
  species: string;
  breed: string | null;
  color: string | null;
  petName: string | null;
  photos: string[];
  locationAddress: string;
  latitude: number;
  longitude: number;
  eventDate: string;
  reward: number | null;
  status: PostStatus;
  distance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LostFoundPostsResponse {
  posts: LostFoundPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LostFoundQueryParams {
  page?: number;
  limit?: number;
  postType?: PostType;
  species?: string;
  status?: PostStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  latitude?: number;
  longitude?: number;
}

export interface LostFoundLocation {
  _id: string;
  postType: PostType;
  title: string;
  species: string;
  breed: string | null;
  petName: string | null;
  latitude: number;
  longitude: number;
  locationAddress: string;
  photos: string[];
  status: PostStatus;
  eventDate: string;
  createdBy: {
    _id: string;
    name: string;
    profileImage?: string;
  };
}

export interface LostFoundLocationsResponse {
  posts: LostFoundLocation[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const lostFoundApi = {
  /** Get all lost/found posts (public) */
  getPosts: (params?: LostFoundQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
    }
    const queryStr = query.toString();
    return apiRequest<LostFoundPostsResponse>(
      `/api/lost-found${queryStr ? `?${queryStr}` : ""}`,
    );
  },

  /** Get a single post by ID */
  getPostById: (id: string) =>
    apiRequest<LostFoundPost>(`/api/lost-found/${id}`),

  /** Create a new lost/found post (multipart form data) */
  createPost: async (
    formData: FormData,
  ): Promise<ApiResponse<LostFoundPost>> => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/lost-found`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      return parseApiResponse<LostFoundPost>(response, "Failed to create post");
    } catch (error) {
      return { error: getFetchErrorMessage(error) };
    }
  },

  /** Update a post (multipart form data) */
  updatePost: async (
    id: string,
    formData: FormData,
  ): Promise<ApiResponse<LostFoundPost>> => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/lost-found/${id}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: formData,
      });

      return parseApiResponse<LostFoundPost>(response, "Failed to update post");
    } catch (error) {
      return { error: getFetchErrorMessage(error) };
    }
  },

  /** Update post status */
  updatePostStatus: (id: string, status: PostStatus) =>
    apiRequest<LostFoundPost>(
      `/api/lost-found/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      true,
    ),

  /** Delete a post */
  deletePost: (id: string) =>
    apiRequest<{ message: string }>(
      `/api/lost-found/${id}`,
      { method: "DELETE" },
      true,
    ),

  /** Get current user's posts */
  getMyPosts: (params?: LostFoundQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
    }
    const queryStr = query.toString();
    return apiRequest<LostFoundPostsResponse>(
      `/api/lost-found/my-posts${queryStr ? `?${queryStr}` : ""}`,
      {},
      true,
    );
  },

  /** Get post locations for map */
  getPostLocations: (params?: { postType?: PostType; species?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value);
      });
    }
    const queryStr = query.toString();
    return apiRequest<LostFoundLocationsResponse>(
      `/api/map/lost-found${queryStr ? `?${queryStr}` : ""}`,
    );
  },
};
