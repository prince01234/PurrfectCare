import dotenv from "dotenv";

dotenv.config();

const config = {
  appUrl: process.env.APP_URL || "",
  mongoDBUrl: process.env.MONGODB_URL || "",
  name: process.env.NAME || "",
  port: process.env.PORT || "",
  version: process.env.VERSION || "",
  jwtSecret: process.env.JWT_SECRET || "",
  emailApiKey: process.env.EMAIL_API_KEY || "",
};

export default config;
