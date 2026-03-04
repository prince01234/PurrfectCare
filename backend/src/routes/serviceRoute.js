import express from "express";
import serviceProviderController from "../controllers/serviceProviderController.js";
import bookingController from "../controllers/bookingController.js";
import serviceProviderAnalyticsController from "../controllers/serviceProviderAnalyticsController.js";
import marketplaceAnalyticsController from "../controllers/marketplaceAnalyticsController.js";
import merchantOrderController from "../controllers/merchantOrderController.js";
import { auth, requireVerified, requireRole } from "../middlewares/auth.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";
import { uploadProfileImage } from "../utils/file.js";

const providerRouter = express.Router();
const bookingRouter = express.Router();

const providerUpload = uploadProfileImage.fields([
  { name: "image", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

// ─── Service Provider Routes ───

// URL: /api/service-providers - Get all active providers (public)
providerRouter.get("/", serviceProviderController.getProviders);

// URL: /api/service-providers/me - Get my provider profile (auth required)
providerRouter.get(
  "/me",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  serviceProviderController.getMyProvider,
);

// URL: /api/service-providers/me/analytics - Get my analytics (auth required)
providerRouter.get(
  "/me/analytics",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  serviceProviderAnalyticsController.getMyAnalytics,
);

// URL: /api/service-providers/me/marketplace-analytics - Get marketplace analytics (auth required)
providerRouter.get(
  "/me/marketplace-analytics",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  marketplaceAnalyticsController.getMarketplaceAnalytics,
);

// URL: /api/service-providers/me/orders - Get merchant's orders (auth required)
providerRouter.get(
  "/me/orders",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  merchantOrderController.getMerchantOrders,
);

// URL: /api/service-providers/me/orders/:orderId/status - Update order status (auth required)
providerRouter.put(
  "/me/orders/:orderId/status",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  merchantOrderController.updateOrderStatus,
);

// URL: /api/service-providers/:id - Get single provider (public)
providerRouter.get("/:id", serviceProviderController.getProviderById);

// URL: /api/service-providers - Create provider profile (admin only)
providerRouter.post(
  "/",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  providerUpload,
  serviceProviderController.createProvider,
);

// URL: /api/service-providers/me - Update provider profile (admin only)
providerRouter.put(
  "/me",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  providerUpload,
  serviceProviderController.updateProvider,
);

// URL: /api/service-providers/me - Delete provider profile (admin only)
providerRouter.delete(
  "/me",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  serviceProviderController.deleteProvider,
);

// URL: /api/service-providers/me/services/:optionId/image - Upload service option image
providerRouter.put(
  "/me/services/:optionId/image",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  uploadProfileImage.single("image"),
  serviceProviderController.uploadServiceOptionImage,
);

// ─── Booking Routes ───

// URL: /api/bookings - Create a booking (auth required)
bookingRouter.post("/", auth, requireVerified, bookingController.createBooking);

// URL: /api/bookings/my - Get user's bookings
bookingRouter.get("/my", auth, bookingController.getUserBookings);

// URL: /api/bookings/provider - Get provider's bookings
bookingRouter.get(
  "/provider",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  bookingController.getProviderBookings,
);

// URL: /api/bookings/slots/:providerId - Get booked slots for a provider (public)
bookingRouter.get("/slots/:providerId", bookingController.getBookedSlots);

// URL: /api/bookings/:id - Get single booking
bookingRouter.get("/:id", auth, bookingController.getBookingById);

// URL: /api/bookings/:id/confirm - Confirm booking (provider only)
bookingRouter.put(
  "/:id/confirm",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  bookingController.confirmBooking,
);

// URL: /api/bookings/:id/reject - Reject booking (provider only)
bookingRouter.put(
  "/:id/reject",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  bookingController.rejectBooking,
);

// URL: /api/bookings/:id/cancel - Cancel booking (user only)
bookingRouter.put("/:id/cancel", auth, bookingController.cancelBooking);

// URL: /api/bookings/:id/complete - Complete booking (provider only)
bookingRouter.put(
  "/:id/complete",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  bookingController.completeBooking,
);

// URL: /api/bookings/:id/payment/khalti - Initiate Khalti payment
bookingRouter.post(
  "/:id/payment/khalti",
  auth,
  requireVerified,
  bookingController.bookingPaymentViaKhalti,
);

// URL: /api/bookings/:id/confirm-payment - Confirm payment after Khalti callback
bookingRouter.put(
  "/:id/confirm-payment",
  auth,
  requireVerified,
  bookingController.confirmBookingPayment,
);

export { providerRouter, bookingRouter };
