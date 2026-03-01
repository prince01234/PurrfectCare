import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import config from "./config/config.js";
import connectDB from "./config/dbConnection.js";

import userRoutes from "./routes/userRoute.js";
import authRoutes from "./routes/authRoute.js";
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

import logger from "./middlewares/logger.js";
import connectCloudinary from "./config/cloudinary.js";
import reminderScheduler from "./jobs/reminderScheduler.js";

const app = express();

// const allowedOrigins = ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean);
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
//     callback(null, false);
//   },
//   credentials: true,
// }));

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

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

// Start reminder scheduler
reminderScheduler.startScheduler();

app.listen(config.port, () => {
  console.log(`Server is running at port http://localhost:${config.port}...`);
});
