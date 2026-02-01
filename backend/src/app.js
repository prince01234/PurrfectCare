import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import config from "./config/config.js";
import connectDB from "./config/dbConnection.js";

import userRoutes from "./routes/userRoute.js";
import authRoutes from "./routes/authRoute.js";

import logger from "./middlewares/logger.js";

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
