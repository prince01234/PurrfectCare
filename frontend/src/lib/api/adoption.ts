import { apiRequest, API_URL, getAuthToken } from "./client";
import type { ApiResponse } from "./client";

// ── Types ──
export interface AdoptionListing {
  _id: string;
  postedBy: {
    _id: string;
    name: string;
    profileImage?: string;
    phoneNumber?: string;
    organizationName?: string;
  };
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  description: string;
  healthInfo?: string;
  temperament?: string;
  specialNeeds?: string;
  adoptionFee?: number;
  photos: string[];
  location: string;
  status: "available" | "adopted";
  adoptedBy?: string;
  adoptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionListingsResponse {
  listings: AdoptionListing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdoptionApplication {
  _id: string;
  listingId: AdoptionListing | string;
  applicantId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  message: string;
  contactPhone: string;
  contactEmail: string;
  livingSituation: string;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionApplicationsResponse {
  applications: AdoptionApplication[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Helper: multipart form request ──
async function adoptionFormRequest<T>(
  endpoint: string,
  method: string,
  data: Record<string, unknown>,
  photos?: File[],
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append photos
    if (photos && photos.length > 0) {
      photos.forEach((file) => formData.append("photos", file));
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      return {
        error: result.error || result.message || "Something went wrong",
      };
    }
    return { data: result };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

// ── Adoption Listings API ──
export const adoptionListingApi = {
  // Public: Browse listings
  getListings: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    species?: string;
    gender?: string;
    location?: string;
  }): Promise<ApiResponse<AdoptionListingsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.species) searchParams.set("species", params.species);
    if (params?.gender) searchParams.set("gender", params.gender);
    if (params?.location) searchParams.set("location", params.location);
    const query = searchParams.toString();
    return apiRequest(`/api/adoption/listings${query ? `?${query}` : ""}`);
  },

  // Public: Single listing
  getListingById: (id: string): Promise<ApiResponse<AdoptionListing>> =>
    apiRequest(`/api/adoption/listings/${id}`),

  // Admin: Get own listings
  getMyListings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<AdoptionListingsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest(
      `/api/adoption/listings/admin/list${query ? `?${query}` : ""}`,
      {},
      true,
    );
  },

  // Admin: Create listing
  createListing: (
    data: Record<string, unknown>,
    photos?: File[],
  ): Promise<ApiResponse<AdoptionListing>> =>
    adoptionFormRequest("/api/adoption/listings/admin", "POST", data, photos),

  // Admin: Update listing
  updateListing: (
    id: string,
    data: Record<string, unknown>,
    photos?: File[],
  ): Promise<ApiResponse<AdoptionListing>> =>
    adoptionFormRequest(
      `/api/adoption/listings/admin/${id}`,
      "PUT",
      data,
      photos,
    ),

  // Admin: Delete listing
  deleteListing: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(
      `/api/adoption/listings/admin/${id}`,
      { method: "DELETE" },
      true,
    ),
};

export interface AdoptionStatsResponse {
  listings: {
    total: number;
    available: number;
    adopted: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// ── Adoption Applications API ──
export const adoptionApplicationApi = {
  // User: Submit application
  createApplication: (
    listingId: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<AdoptionApplication>> =>
    apiRequest(
      `/api/adoption/applications/listing/${listingId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),

  // User: Get my applications
  getMyApplications: (): Promise<ApiResponse<AdoptionApplicationsResponse>> =>
    apiRequest("/api/adoption/applications/me", {}, true),

  // Get single application
  getApplicationById: (id: string): Promise<ApiResponse<AdoptionApplication>> =>
    apiRequest(`/api/adoption/applications/${id}`, {}, true),

  // Admin: Get ALL applications across all listings
  getAllApplications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<AdoptionApplicationsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest(
      `/api/adoption/applications/admin/all${query ? `?${query}` : ""}`,
      {},
      true,
    );
  },

  // Admin: Get adoption stats for dashboard
  getAdoptionStats: (): Promise<ApiResponse<AdoptionStatsResponse>> =>
    apiRequest("/api/adoption/applications/admin/stats", {}, true),

  // Admin: Get applications for a listing
  getApplicationsByListing: (
    listingId: string,
  ): Promise<ApiResponse<AdoptionApplicationsResponse>> =>
    apiRequest(`/api/adoption/applications/listing/${listingId}`, {}, true),

  // Admin: Approve application
  approveApplication: (
    applicationId: string,
    reviewNotes?: string,
  ): Promise<ApiResponse<AdoptionApplication>> =>
    apiRequest(
      `/api/adoption/applications/${applicationId}/approve`,
      {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes }),
      },
      true,
    ),

  // Admin: Reject application
  rejectApplication: (
    applicationId: string,
    reviewNotes?: string,
  ): Promise<ApiResponse<AdoptionApplication>> =>
    apiRequest(
      `/api/adoption/applications/${applicationId}/reject`,
      {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes }),
      },
      true,
    ),
};
