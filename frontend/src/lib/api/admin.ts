import { apiRequest } from "./client";
import type { ApiResponse } from "./client";

// ── Types ──
export interface AdminApplication {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  organizationName: string;
  serviceType: string;
  serviceDescription: string;
  contactPhone: string;
  contactAddress: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminApplicationsResponse {
  applications: AdminApplication[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApplyData {
  organizationName: string;
  serviceType: string;
  serviceDescription: string;
  contactPhone: string;
  contactAddress: string;
}

// ── API ──
export const adminApi = {
  // Apply to become a service provider
  apply: (data: ApplyData): Promise<ApiResponse<AdminApplication>> =>
    apiRequest(
      "/api/admin/apply",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),

  // Get current user's application
  getMyApplication: (): Promise<ApiResponse<AdminApplication>> =>
    apiRequest("/api/admin", {}, true),

  // Super Admin: Get all applications
  getAllApplications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    serviceType?: string;
  }): Promise<ApiResponse<AdminApplicationsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.serviceType)
      searchParams.set("serviceType", params.serviceType);
    const query = searchParams.toString();
    return apiRequest(
      `/api/admin/applications${query ? `?${query}` : ""}`,
      {},
      true,
    );
  },

  // Super Admin: Approve application
  approveApplication: (
    applicationId: string,
    reviewNotes?: string,
  ): Promise<ApiResponse<AdminApplication>> =>
    apiRequest(
      `/api/admin/applications/${applicationId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ reviewNotes }),
      },
      true,
    ),

  // Super Admin: Reject application
  rejectApplication: (
    applicationId: string,
    rejectionReason: string,
  ): Promise<ApiResponse<AdminApplication>> =>
    apiRequest(
      `/api/admin/applications/${applicationId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ rejectionReason }),
      },
      true,
    ),
};
