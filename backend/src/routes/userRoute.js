import express from "express";
import userController from "../controllers/userController.js";
import { auth, requireVerified } from "../middlewares/auth.js";
import { uploadProfileImage } from "../utils/file.js";

const router = express.Router();

// URL: /api/users - Create user (admin only, usually registration is via auth)
router.post("/", userController.createUser);

// URL: /api/users - Get all users (for admin purposes)
router.get("/", auth, userController.getUser);

// URL: /api/users/:id - Get user by ID (for profile viewing)
router.get("/:id", auth, userController.getUserById);

// URL: /api/users/:id - Update user profile (requires verification for profile changes)
router.put(
  "/:id",
  auth,
  requireVerified,
  uploadProfileImage.single("profileImage"),
  userController.updateUser,
);

// URL: /api/users/:id/onboarding - Complete onboarding (auth only, no verification needed)
router.post("/:id/onboarding", auth, userController.completeOnboarding);

// URL: /api/users/:id - Delete user (requires verification)
router.delete("/:id", auth, requireVerified, userController.deleteUser);

export default router;
