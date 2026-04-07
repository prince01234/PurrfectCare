import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import config from "./config/config.js";
import userRoutes from "./routes/userRoute.js";
import authRoutes from "./routes/authRoute.js";
import socialAuthRoutes from "./routes/socialAuthRoute.js";
import petRoutes from "./routes/petRoute.js";
import healthRoutes from "./routes/healthRoute.js";
import { userReminderRouter } from "./routes/reminderRoute.js";
import productRoutes from "./routes/productRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import adminApplicationRoutes from "./routes/adminApplicationRoute.js";
import {
  listingRouter as adoptionListingRoutes,
  applicationRouter as adoptionApplicationRoutes,
} from "./routes/adoptionRoute.js";
import messagingRoutes from "./routes/messagingRoute.js";
import mapRoutes from "./routes/mapRoute.js";
import {
  providerRouter as serviceProviderRoutes,
  bookingRouter as bookingRoutes,
} from "./routes/serviceRoute.js";
import lostFoundRoutes from "./routes/lostFoundRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import logger from "./middlewares/logger.js";

const normalizeOrigin = (value) =>
  value?.trim().replace(/\/$/, "").toLowerCase();

const getAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

  return new Set(
    [
      "http://localhost:3000",
      "https://prince-shrestha.me",
      "https://www.prince-shrestha.me",
      "https://purrfect-care-sigma.vercel.app",
      ...configuredOrigins,
    ].map(normalizeOrigin),
  );
};

const buildCorsOptions = ({ allowedOrigins, enableDebugLogs = false }) => ({
  origin: (origin, callback) => {
    const isAllowed = !origin || allowedOrigins.has(normalizeOrigin(origin));

    if (enableDebugLogs && process.env.NODE_ENV === "production") {
      console.log(`CORS check: origin=${origin}, allowed=${isAllowed}`);
    }

    if (isAllowed) {
      return callback(null, true);
    }

    if (enableDebugLogs) {
      console.warn(`CORS blocked origin: ${origin}`);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
});

const createApp = ({
  sessionMiddleware = null,
  passportEnabled = false,
  loggerEnabled = true,
  corsDebugLogs = false,
} = {}) => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  if (corsDebugLogs) {
    console.log("CORS allowed origins:", [...allowedOrigins]);
  }

  app.use(
    cors(buildCorsOptions({ allowedOrigins, enableDebugLogs: corsDebugLogs })),
  );
  app.use(cookieParser());

  // Trust proxy for deployments behind a reverse proxy.
  app.set("trust proxy", 1);

  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  if (passportEnabled) {
    app.use(passport.initialize());

    if (sessionMiddleware) {
      app.use(passport.session());
    }
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  if (loggerEnabled) {
    app.use(logger);
  }

  app.get("/", (req, res) => {
    res.json({
      name: config.name,
      port: config.port,
      version: config.version,
    });
  });

  app.get("/healthz", (req, res) => {
    res.status(200).json({ ok: true });
  });

  // User Routes
  app.use("/api/users", userRoutes);

  // Auth Routes
  app.use("/api/auth", authRoutes);

  // Social Auth Routes (OAuth)
  app.use("/api/auth", socialAuthRoutes);

  // Pet Routes
  app.use("/api/pets", petRoutes);

  // Health Routes (global health overview)
  app.use("/api/health", healthRoutes);

  // Reminder Routes (user-level reminders)
  app.use("/api/reminders", userReminderRouter);

  // Marketplace Routes
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);

  app.use("/api/admin", adminApplicationRoutes);

  // Adoption Routes
  app.use("/api/adoption/listings", adoptionListingRoutes);
  app.use("/api/adoption/applications", adoptionApplicationRoutes);

  // Messaging Routes
  app.use("/api/conversations", messagingRoutes);

  // Map Routes
  app.use("/api/map", mapRoutes);

  // Service Booking Routes
  app.use("/api/service-providers", serviceProviderRoutes);
  app.use("/api/bookings", bookingRoutes);

  // Lost & Found Routes
  app.use("/api/lost-found", lostFoundRoutes);

  // Notification Routes
  app.use("/api/notifications", notificationRoutes);

  return app;
};

export { createApp };
export default createApp;
