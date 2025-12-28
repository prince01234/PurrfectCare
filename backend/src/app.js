import express from "express";
import bodyParser from "body-parser";

import config from "../config/config.js";
import connectDB from "../config/dbConnection.js";

import userRoutes from "../routes/userRoute.js";
import authRoutes from "../routes/authRoute.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

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
