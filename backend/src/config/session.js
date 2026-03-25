import session from "express-session";
import MongoStore from "connect-mongo";
import config from "./config.js";

/**
 * Session configuration with MongoDB store
 * - Sessions stored in MongoDB Atlas
 * - 7-day expiration with auto-cleanup
 * - Production-ready cookies (httpOnly, secure, sameSite)
 */
const sessionConfig = session({
  secret: config.sessionSecret || config.jwtSecret || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.mongoDBUrl,
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: "native", // Auto-remove expired sessions
    touchAfter: 24 * 3600, // Lazy session update (update session once per 24 hours)
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

export default sessionConfig;
