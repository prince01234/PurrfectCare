import dotenv from "dotenv";

dotenv.config();

const config = {
  mongoDBUrl: process.env.MONGODB_URL || "",
  name: process.env.NAME || "",
  port: process.env.PORT || "",
  version: process.env.VERSION || "",
  jwtSecret: process.env.JWT_SECRET || "",
};

export default config;
