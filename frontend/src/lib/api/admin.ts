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
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
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

  // Super Admin: Get platform analytics
  getPlatformAnalytics: (): Promise<ApiResponse<PlatformAnalytics>> =>
    apiRequest("/api/admin/analytics", {}, true),
};

// ── Analytics Types ──
export interface PlatformAnalytics {
  overview: {
    totalRevenue: number;
    totalBookingRevenue: number;
    totalOrderRevenue: number;
    totalBookings: number;
    totalOrders: number;
    totalUsers: number;
    totalProviders: number;
    activeProviders: number;
    totalPets: number;
    totalProducts: number;
    thisMonthRevenue: number;
    pendingBookings: number;
    pendingOrders: number;
  };
  revenue: {
    byPaymentMethod: {
      khalti: number;
      cod: number;
    };
    byBookingType: Record<string, number>;
    monthly: Array<{
      year: number;
      month: number;
      bookingRevenue: number;
      bookings: number;
      orderRevenue: number;
      orders: number;
      totalRevenue: number;
      totalTransactions: number;
    }>;
  };
  topProviders: Array<{
    _id: string;
    name: string;
    serviceType: string;
    totalRevenue: number;
    totalBookings: number;
  }>;
  bookingsByStatus: Record<string, number>;
  ordersByStatus: Record<string, number>;
}
