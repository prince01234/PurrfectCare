import express from "express";

import config from "../config/config.js";
import connectDB from "../config/dbConnection.js";

import userRoutes from "../routes/userRoute.js";

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.json({
    name: config.name,
    port: config.port,
    version: config.version,
  });
});

app.use("/api/users", userRoutes);

app.listen(config.port, () => {
  console.log(`Server is running at port http://localhost:${config.port}...`);
});
