import {
  apiRequest,
  API_URL,
  getAuthToken,
  getFetchErrorMessage,
  parseApiResponse,
} from "./client";

// Types
export interface Product {
  _id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  petType: string;
  brand: string | null;
  images: string[];
  stockQty: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  petType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: "asc" | "desc";
  includeInactive?: boolean;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  category: string;
  petType: string;
  brand?: string;
  stockQty?: number;
  isActive?: boolean;
}

async function uploadFormData<T>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST",
) {
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

    return parseApiResponse<T>(response);
  } catch (error) {
    return { error: getFetchErrorMessage(error) };
  }
}

export const productApi = {
  // Public endpoints
  getProducts: (params?: ProductQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return apiRequest<ProductsResponse>(`/api/products${qs ? `?${qs}` : ""}`);
  },

  getProductById: (id: string) => apiRequest<Product>(`/api/products/${id}`),

  // Admin endpoints
  getAdminProducts: (params?: ProductQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return apiRequest<ProductsResponse>(
      `/api/products/admin/list${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  createProduct: (data: CreateProductData, images?: File[]) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        fd.append(k, String(v));
      }
    });
    if (images && images.length > 0) {
      images.forEach((file) => fd.append("images", file));
    }
    return uploadFormData<Product>("/api/products/admin", fd, "POST");
  },

  updateProduct: (
    id: string,
    data: Partial<CreateProductData>,
    images?: File[],
  ) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        fd.append(k, String(v));
      }
    });
    if (images && images.length > 0) {
      images.forEach((file) => fd.append("images", file));
    }
    return uploadFormData<Product>(`/api/products/admin/${id}`, fd, "PUT");
  },

  deleteProduct: (id: string) =>
    apiRequest<{ message: string }>(
      `/api/products/admin/${id}`,
      { method: "DELETE" },
      true,
    ),
};
