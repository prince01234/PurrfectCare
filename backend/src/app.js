import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import config from "./config/config.js";
import connectDB from "./config/dbConnection.js";
import initializeSocket from "./config/socket.js";
import sessionConfig from "./config/session.js";
import "./config/firebase.js";
import passport from "./config/passport.js";

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
import connectCloudinary from "./config/cloudinary.js";
import reminderScheduler from "./jobs/reminderScheduler.js";
import { setIO } from "./config/realtime.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }),
);

//app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Trust proxy for Render deployment (behind reverse proxy)
app.set("trust proxy", 1);

// MongoDB Session Store (configured in config/session.js)
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();
connectCloudinary();

app.use(logger);

app.get("/", (req, res) => {
  res.json({
    name: config.name,
    port: config.port,
    version: config.version,
  });
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

// Initialize Socket.IO
const io = initializeSocket(httpServer);
app.set("io", io);
setIO(io);

// Notification Routes
app.use("/api/notifications", notificationRoutes);

// Start reminder scheduler
reminderScheduler.startScheduler();

httpServer.listen(config.port, () => {
  console.log(
    `Server running at ${
      process.env.APP_URL || `http://localhost:${config.port}`
    }`,
  );
});
