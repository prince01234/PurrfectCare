import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import config from "./config/config.js";
import connectDB from "./config/dbConnection.js";

import userRoutes from "./routes/userRoute.js";
import authRoutes from "./routes/authRoute.js";

import logger from "./middlewares/logger.js";

const app = express();

// ============================================================================
// CORS CONFIGURATION OPTIONS
// ============================================================================
// Choose ONE of the following CORS configurations by uncommenting it
// and commenting out the other one.

// ----------------------------------------------------------------------------
// OPTION 1: CURRENT - Specific Origins Only (More Secure)
// Use this for production or when you want to restrict access
// ----------------------------------------------------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any 192.168.x.x origin for local network testing
      if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

// ----------------------------------------------------------------------------
// OPTION 2: ALLOW ANY LOCAL NETWORK (Less Secure - Development Only)
// Uncomment the block below and comment out OPTION 1 above to allow
// requests from ANY local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
// ----------------------------------------------------------------------------
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (mobile apps, curl, etc.)
//       if (!origin) return callback(null, true);
//
//       // Allow localhost
//       if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
//         return callback(null, true);
//       }
//
//       // Allow any private/local network IP address
//       // 192.168.x.x - Most common home/office networks
//       // 10.x.x.x - Large private networks
//       // 172.16.x.x to 172.31.x.x - Medium private networks
//       const localNetworkPatterns = [
//         /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
//         /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
//         /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
//       ];
//
//       const isLocalNetwork = localNetworkPatterns.some(pattern => pattern.test(origin));
//       if (isLocalNetwork) {
//         return callback(null, true);
//       }
//
//       // Optionally allow FRONTEND_URL if set
//       if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
//         return callback(null, true);
//       }
//
//       return callback(null, false);
//     },
//     credentials: true,
//   }),
// );
// ============================================================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

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

app.listen(config.port, () => {
  console.log(`Server is running at port http://localhost:${config.port}...`);
});
