// Central re-export for all API modules
// Import from "@/lib/api" as before — no changes needed in consuming files

export { apiRequest, isVerificationError } from "./client";
export type { ApiResponse } from "./client";
export { authApi } from "./auth";
export { userApi } from "./user";
export { productApi } from "./product";
export type { Product, ProductsResponse, ProductQueryParams } from "./product";
export { cartApi } from "./cart";
export type { Cart, CartItem, CartActionResponse } from "./cart";
export { orderApi } from "./order";
export type {
  Order,
  OrderItem,
  OrdersResponse,
  CreateOrderData,
  KhaltiPaymentResponse,
} from "./order";
export { petApi } from "./pet";
export type {
  Pet,
  PetsResponse,
  PetQueryParams,
  PetStats,
  Vaccination,
  MedicalRecord,
  Reminder,
  HealthOverview,
} from "./pet";
