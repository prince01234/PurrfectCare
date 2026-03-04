import { apiRequest, getAuthToken, API_URL } from "./client";
import type { ApiResponse } from "./client";

// ── Types ──

export interface AvailabilitySlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ServiceOption {
  _id?: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  image?: string | null;
}

export interface ServiceProviderUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  roles: string;
  serviceType: string;
  organizationName?: string;
}

export interface ServiceProvider {
  _id: string;
  userId: ServiceProviderUser;
  serviceType: string;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
  coverImage?: string | null;
  amenities: string[];
  rating: number;
  totalRatings: number;
  availability: AvailabilitySlot[];
  serviceOptions: ServiceOption[];
  slotDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProvidersResponse {
  providers: ServiceProvider[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookingPet {
  _id: string;
  name: string;
  species: string;
  photos?: string[];
}

export interface BookingUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  phoneNumber?: string;
}

export interface BookingProvider {
  _id: string;
  name: string;
  serviceType: string;
  image?: string;
  phone?: string;
  address?: string;
  userId?: string;
}

export interface Booking {
  _id: string;
  userId: BookingUser;
  providerId: BookingProvider;
  petIds?: BookingPet[];
  bookingType: "time_slot" | "date_range";
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  serviceOption?: {
    name?: string | null;
    price?: number | null;
    duration?: number | null;
  };
  notes?: string | null;
  paymentMethod?: "khalti" | "cod";
  payment?: string | null;
  paymentStatus?: "pending" | "completed" | "failed";
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  providerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookedSlotsResponse {
  bookedSlots?: { startTime: string; endTime: string; status: string }[];
  bookedRanges?: {
    startDate: string;
    endDate: string;
    status: string;
  }[];
}

export interface CreateBookingData {
  providerId: string;
  petIds?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  serviceOption?: {
    name: string;
    price?: number;
    duration?: number;
  };
  notes?: string;
  paymentMethod?: "khalti" | "cod";
}

export interface CreateProviderData {
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  amenities?: string[];
  availability?: AvailabilitySlot[];
  serviceOptions?: ServiceOption[];
  slotDuration?: number;
}

// ── Helpers ──

async function uploadFormData<T>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || data.message || "Something went wrong" };
    }
    return { data };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

function buildProviderFormData(
  data: CreateProviderData | Partial<CreateProviderData>,
  imageFile?: File | null,
  coverImageFile?: File | null,
): FormData {
  const fd = new FormData();
  if (data.name) fd.append("name", data.name);
  if (data.description) fd.append("description", data.description);
  if (data.address) fd.append("address", data.address);
  if (data.latitude != null) fd.append("latitude", String(data.latitude));
  if (data.longitude != null) fd.append("longitude", String(data.longitude));
  if (data.phone) fd.append("phone", data.phone);
  if (data.email) fd.append("email", data.email);
  if (data.slotDuration != null)
    fd.append("slotDuration", String(data.slotDuration));
  if (data.availability)
    fd.append("availability", JSON.stringify(data.availability));
  if (data.serviceOptions)
    fd.append("serviceOptions", JSON.stringify(data.serviceOptions));
  if (data.amenities) fd.append("amenities", JSON.stringify(data.amenities));
  if (imageFile) fd.append("image", imageFile);
  if (coverImageFile) fd.append("coverImage", coverImageFile);
  return fd;
}

// ── API ──

export const serviceProviderApi = {
  // Get all active providers (public)
  getProviders: (params?: {
    page?: number;
    limit?: number;
    serviceType?: string;
    search?: string;
  }): Promise<ApiResponse<ServiceProvidersResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.serviceType)
      searchParams.set("serviceType", params.serviceType);
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return apiRequest(
      `/api/service-providers${query ? `?${query}` : ""}`,
      {},
      false,
    );
  },

  // Get single provider by ID (public)
  getProviderById: (id: string): Promise<ApiResponse<ServiceProvider>> =>
    apiRequest(`/api/service-providers/${id}`, {}, false),

  // Get my provider profile (admin)
  getMyProvider: (): Promise<ApiResponse<ServiceProvider>> =>
    apiRequest("/api/service-providers/me", {}, true),

  // Create provider profile (admin)
  createProvider: (
    data: CreateProviderData,
    imageFile?: File | null,
    coverImageFile?: File | null,
  ): Promise<ApiResponse<ServiceProvider>> => {
    const fd = buildProviderFormData(data, imageFile, coverImageFile);
    return uploadFormData("/api/service-providers", fd, "POST");
  },

  // Update provider profile (admin)
  updateProvider: (
    data: Partial<CreateProviderData>,
    imageFile?: File | null,
    coverImageFile?: File | null,
  ): Promise<ApiResponse<ServiceProvider>> => {
    const fd = buildProviderFormData(data, imageFile, coverImageFile);
    return uploadFormData("/api/service-providers/me", fd, "PUT");
  },

  // Delete provider profile (admin)
  deleteProvider: (): Promise<ApiResponse<{ message: string }>> =>
    apiRequest("/api/service-providers/me", { method: "DELETE" }, true),

  // Upload image for a specific service option
  uploadServiceOptionImage: (
    optionId: string,
    imageFile: File,
  ): Promise<ApiResponse<ServiceProvider>> => {
    const fd = new FormData();
    fd.append("image", imageFile);
    return uploadFormData(
      `/api/service-providers/me/services/${optionId}/image`,
      fd,
      "PUT",
    );
  },

  // Get provider analytics
  getProviderAnalytics: (): Promise<ApiResponse<ServiceProviderAnalytics>> =>
    apiRequest("/api/service-providers/me/analytics", {}, true),

  // Get merchant orders (marketplace)
  getMerchantOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<MerchantOrdersResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest(
      `/api/service-providers/me/orders${query ? `?${query}` : ""}`,
      {},
      true,
    );
  },

  // Update order status (marketplace merchant)
  updateMerchantOrderStatus: (
    orderId: string,
    status: string,
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(
      `/api/service-providers/me/orders/${orderId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
      true,
    ),
};

export const bookingApi = {
  // Create a booking
  createBooking: (data: CreateBookingData): Promise<ApiResponse<Booking>> =>
    apiRequest(
      "/api/bookings",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),

  // Get user's bookings
  getUserBookings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<BookingsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest(`/api/bookings/my${query ? `?${query}` : ""}`, {}, true);
  },

  // Get provider's bookings
  getProviderBookings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<BookingsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return apiRequest(
      `/api/bookings/provider${query ? `?${query}` : ""}`,
      {},
      true,
    );
  },

  // Get single booking
  getBookingById: (id: string): Promise<ApiResponse<Booking>> =>
    apiRequest(`/api/bookings/${id}`, {}, true),

  // Get booked slots for availability (public)
  getBookedSlots: (
    providerId: string,
    date: string,
    serviceOptionName?: string,
  ): Promise<ApiResponse<BookedSlotsResponse>> =>
    apiRequest(
      `/api/bookings/slots/${providerId}?date=${encodeURIComponent(date)}${serviceOptionName ? `&serviceOptionName=${encodeURIComponent(serviceOptionName)}` : ""}`,
      {},
      false,
    ),

  // Initiate Khalti payment for a booking
  initiateKhaltiPayment: (
    bookingId: string,
  ): Promise<ApiResponse<{ payment_url: string }>> =>
    apiRequest(
      `/api/bookings/${bookingId}/payment/khalti`,
      { method: "POST" },
      true,
    ),

  // Confirm payment after Khalti callback
  confirmPayment: (
    bookingId: string,
    status: string,
  ): Promise<ApiResponse<Booking>> =>
    apiRequest(
      `/api/bookings/${bookingId}/confirm-payment`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
      true,
    ),

  // Confirm booking (provider)
  confirmBooking: (
    id: string,
    providerNotes?: string,
  ): Promise<ApiResponse<Booking>> =>
    apiRequest(
      `/api/bookings/${id}/confirm`,
      {
        method: "PUT",
        body: JSON.stringify({ providerNotes }),
      },
      true,
    ),

  // Reject booking (provider)
  rejectBooking: (
    id: string,
    providerNotes?: string,
  ): Promise<ApiResponse<Booking>> =>
    apiRequest(
      `/api/bookings/${id}/reject`,
      {
        method: "PUT",
        body: JSON.stringify({ providerNotes }),
      },
      true,
    ),

  // Cancel booking (user)
  cancelBooking: (id: string): Promise<ApiResponse<Booking>> =>
    apiRequest(`/api/bookings/${id}/cancel`, { method: "PUT" }, true),

  // Complete booking (provider)
  completeBooking: (id: string): Promise<ApiResponse<Booking>> =>
    apiRequest(`/api/bookings/${id}/complete`, { method: "PUT" }, true),

  // Get provider analytics
  getProviderAnalytics: (): Promise<ApiResponse<ServiceProviderAnalytics>> =>
    apiRequest("/api/service-providers/me/analytics", {}, true),

  // Get marketplace analytics
  getMarketplaceAnalytics: (): Promise<ApiResponse<MarketplaceAnalytics>> =>
    apiRequest("/api/service-providers/me/marketplace-analytics", {}, true),
};

// ── Analytics Types ──
export interface ServiceProviderAnalytics {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    pendingBookings: number;
    upcomingBookings: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
  };
  revenueByMethod: {
    khalti: number;
    cod: number;
  };
  monthlyRevenue: Array<{
    year: number;
    month: number;
    revenue: number;
    bookings: number;
  }>;
  topServices: Array<{
    name: string;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    date: string;
    serviceName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    customer: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export interface MarketplaceAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalItemsSold: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
  };
  revenueByMethod: {
    khalti: number;
    cod: number;
  };
  revenueByCategory: Record<string, number>;
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantitySold: number;
  }>;
  monthlyRevenue: Array<{
    year: number;
    month: number;
    revenue: number;
    orders: number;
    itemsSold: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQty: number;
    price: number;
    category: string;
  }>;
  recentOrders: Array<{
    id: string;
    status: string;
    paymentMethod: string;
    totalAmount: number;
    itemCount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    customer: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export interface MerchantOrderItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  nameSnapshot: string;
  imageSnapshot: string | null;
}

export interface MerchantOrder {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    phone?: string;
  };
  items: MerchantOrderItem[];
  merchantTotal: number;
  fullTotal: number;
  status: "pending" | "confirmed" | "processing" | "delivered" | "cancelled";
  paymentMethod: "khalti" | "cod";
  payment: {
    status: string;
    method: string;
    amount: number;
  } | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantOrdersResponse {
  orders: MerchantOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
