import express from "express";
import adoptionListingController from "../controllers/adoptionListingController.js";
import adoptionApplicationController from "../controllers/adoptionApplicationController.js";
import { auth, requireVerified, requireRole } from "../middlewares/auth.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";
import multer from "multer";

// Multer config for adoption listing photos
const uploadAdoptionPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    allowedMimes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type. Only JPEG, PNG, WebP, GIF allowed."));
  },
});

// ──────── Listing Routes ────────
const listingRouter = express.Router();

// Public routes
// GET /api/adoption/listings — Browse all available listings
listingRouter.get("/", adoptionListingController.getListings);

// GET /api/adoption/listings/admin/list — Get own listings (Admin with pet_adoption service)
listingRouter.get(
  "/admin/list",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionListingController.getMyListings,
);

// GET /api/adoption/listings/:id — View single listing detail (Public)
listingRouter.get("/:id", adoptionListingController.getListingById);

// POST /api/adoption/listings/admin — Create a new listing
listingRouter.post(
  "/admin",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  uploadAdoptionPhotos.array("photos", 5),
  adoptionListingController.createListing,
);

// PUT /api/adoption/listings/admin/:id — Update a listing
listingRouter.put(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  uploadAdoptionPhotos.array("photos", 5),
  adoptionListingController.updateListing,
);

// DELETE /api/adoption/listings/admin/:id — Soft delete a listing
listingRouter.delete(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionListingController.deleteListing,
);

// ──────── Application Routes ────────
const applicationRouter = express.Router();

// Admin routes (must be before /:id to avoid route conflicts)
// GET /api/adoption/applications/admin/all — Get ALL applications (Admin/Super Admin)
applicationRouter.get(
  "/admin/all",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionApplicationController.getAllApplications,
);

// GET /api/adoption/applications/admin/stats — Get adoption stats for dashboard
applicationRouter.get(
  "/admin/stats",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionApplicationController.getAdoptionStats,
);

// User routes
// GET /api/adoption/applications/me — Get my own applications (any logged-in user)
applicationRouter.get(
  "/me",
  auth,
  adoptionApplicationController.getMyApplications,
);

// GET /api/adoption/applications/:id — Get single application detail (applicant or listing owner)
applicationRouter.get(
  "/:id",
  auth,
  adoptionApplicationController.getApplicationById,
);

// POST /api/adoption/applications/listing/:listingId — Apply for adoption (any verified user)
applicationRouter.post(
  "/listing/:listingId",
  auth,
  requireVerified,
  adoptionApplicationController.createApplication,
);

// Admin/Provider routes (listing owner)
// GET /api/adoption/applications/listing/:listingId — Get all applications for a listing
applicationRouter.get(
  "/listing/:listingId",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionApplicationController.getApplicationsByListing,
);

// PATCH /api/adoption/applications/:id/approve — Approve an application
applicationRouter.patch(
  "/:id/approve",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionApplicationController.approveApplication,
);

// PATCH /api/adoption/applications/:id/reject — Reject an application
applicationRouter.patch(
  "/:id/reject",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  adoptionApplicationController.rejectApplication,
);

export { listingRouter, applicationRouter };
