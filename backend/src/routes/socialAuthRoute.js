import express from "express";
import passport from "passport";
import { createJWT } from "../utils/jwt.js";
import config from "../config/config.js";

const router = express.Router();

const AUTH_COOKIE_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const authCookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
};

// Google OAuth Routes
// URL: /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// URL: /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie (more secure than URL params)
      res.cookie("authToken", authToken, authCookieOptions);

      // Redirect to frontend callback WITHOUT token in URL
      // Frontend will verify auth status by calling /api/auth/me
      const redirectUrl = `${config.frontendUrl}/auth/callback?provider=google`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  },
);

// Facebook OAuth Routes
// URL: /api/auth/facebook
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  }),
);

// URL: /api/auth/facebook/callback
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie (more secure than URL params)
      res.cookie("authToken", authToken, authCookieOptions);

      // Redirect to frontend callback WITHOUT token in URL
      // Frontend will verify auth status by calling /api/auth/me
      const redirectUrl = `${config.frontendUrl}/auth/callback?provider=facebook`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Facebook OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  },
);

// GitHub OAuth Routes
// URL: /api/auth/github
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  }),
);

// URL: /api/auth/github/callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie (more secure than URL params)
      res.cookie("authToken", authToken, authCookieOptions);

      // Redirect to frontend callback WITHOUT token in URL
      // Frontend will verify auth status by calling /api/auth/me
      const redirectUrl = `${config.frontendUrl}/auth/callback?provider=github`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  },
);

export default router;
