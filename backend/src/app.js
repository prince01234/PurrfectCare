import express from "express";

import config from "../config/config.js";
import connectDB from "../config/dbConnection.js";

const app = express();

connectDB();

app.listen(config.port, () => {
  console.log(`Server is running at port http://localhost:${config.port}...`);
});
