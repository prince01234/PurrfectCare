import { apiRequest } from "./client";

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
}

export const productApi = {
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
    return apiRequest<ProductsResponse>(
      `/api/products${qs ? `?${qs}` : ""}`,
    );
  },

  getProductById: (id: string) =>
    apiRequest<Product>(`/api/products/${id}`),
};
