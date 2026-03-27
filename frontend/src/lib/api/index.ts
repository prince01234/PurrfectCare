// Central re-export for all API modules
// Import from "@/lib/api" as before — no changes needed in consuming files

export {
  apiRequest,
  isVerificationError,
  API_URL,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "./client";
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
export { adminApi } from "./admin";
export type {
  AdminApplication,
  AdminApplicationsResponse,
  ApplyData,
  PlatformAnalytics,
} from "./admin";
export { adoptionListingApi, adoptionApplicationApi } from "./adoption";
export type {
  AdoptionListing,
  AdoptionListingsResponse,
  AdoptionApplication,
  AdoptionApplicationsResponse,
} from "./adoption";
export { messagingApi } from "./messaging";
export type {
  Conversation,
  ConversationParticipant,
  ConversationContext,
  Message,
  ConversationsResponse,
  MessagesResponse,
  GetOrCreateConversationResponse,
  SendMessageResponse,
} from "./messaging";
export { notificationApi } from "./notification";
export type {
  AppNotification,
  NotificationType,
  NotificationListResponse,
} from "./notification";
export { mapApi } from "./map";
export type {
  ProviderLocation,
  AdoptionLocation,
  ProviderLocationsResponse,
  AdoptionLocationsResponse,
} from "./map";
export { serviceProviderApi, bookingApi } from "./service";
export type {
  ServiceProvider,
  ServiceProvidersResponse,
  ServiceOption,
  AvailabilitySlot,
  Booking,
  BookingsResponse,
  BookedSlotsResponse,
  CreateBookingData,
  CreateProviderData,
  ServiceProviderAnalytics,
  MarketplaceAnalytics,
  MerchantOrder,
  MerchantOrderItem,
  MerchantOrdersResponse,
} from "./service";
export { lostFoundApi } from "./lostFound";
export type {
  LostFoundPost,
  LostFoundPostsResponse,
  PostType,
  PostStatus,
  LostFoundQueryParams,
} from "./lostFound";
