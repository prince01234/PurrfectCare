import express from "express";
import passport from "passport";
import { createJWT } from "../utils/jwt.js";
import config from "../config/config.js";

const router = express.Router();

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
    failureRedirect: "/login",
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie
      res.cookie("authToken", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with token in URL query param for JS access
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${authToken}&provider=google`;
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
    failureRedirect: "/login",
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie
      res.cookie("authToken", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with token in URL query param
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${authToken}&provider=facebook`;
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
    failureRedirect: "/login",
  }),
  (req, res) => {
    try {
      const user = req.user;

      // Convert Mongoose document to plain object
      const userData = user.toObject ? user.toObject() : user;

      // Create JWT token
      const authToken = createJWT(userData);

      // Set HTTP-only cookie
      res.cookie("authToken", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with token in URL query param
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${authToken}&provider=github`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  },
);

export default router;
