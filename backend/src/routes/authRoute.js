import express from "express";
import authController from "../controllers/authController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// URL: /api/auth/register
router.post("/register", authController.registerUser);

//URl: /api/auth/login
router.post("/login", authController.loginUser);

// URL: /api/auth/me
// Get current authenticated user info
router.get("/me", auth, authController.getCurrentUser);

// URL: /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// URL: /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// URL: /api/auth/change-password
router.post("/change-password", auth, authController.changePassword);

// URL: /api/auth/verify-reset-otp
router.post("/verify-reset-otp", authController.verifyResetOtp);

// URL: /api/auth/verify-email/:userId/:token
router.post("/verify-email", authController.verifyAccount);

// URL: /api/auth/resend-verification
router.post("/resend-verification", authController.resendVerification);

// URL: /api/auth/logout
router.post("/logout", authController.logout);

export default router;
