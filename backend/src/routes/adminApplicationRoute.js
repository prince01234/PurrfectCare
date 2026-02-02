import express from "express";
import adminApplicationController from "../controllers/adminApplicationController.js";
import { auth, requireVerified, requireRole } from "../middlewares/auth.js";
import { SUPER_ADMIN } from "../constants/roles.js";

const router = express.Router();

// URL: /api/admin/apply - Apply to become service provider/admin
router.post(
  "/apply",
  auth,
  requireVerified,
  adminApplicationController.applyAsAdmin,
);

// URL: /api/admin - Get user's own application
router.get("/", auth, adminApplicationController.getMyApplication);

// URL: /api/admin/applications - Get all service provider applications (SUPER_ADMIN only)
router.get(
  "/applications",
  auth,
  requireRole(SUPER_ADMIN),
  adminApplicationController.getAllApplications,
);

// URL: /api/admin/applications/:id/approve - Approve service provider application (SUPER_ADMIN only)
router.post(
  "/applications/:id/approve",
  auth,
  requireVerified,
  requireRole(SUPER_ADMIN),
  adminApplicationController.approveApplication,
);

// URL: /api/admin/applications/:id/reject - Reject service provider application (SUPER_ADMIN only)
router.post(
  "/applications/:id/reject",
  auth,
  requireVerified,
  requireRole(SUPER_ADMIN),
  adminApplicationController.rejectApplication,
);

export default router;
