import session from "express-session";
import MongoStore from "connect-mongo";
import config from "./config.js";

const SESSION_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = 3 * 24 * 60 * 60;

const sessionConfig = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.mongoDBUrl,
    collectionName: "sessions",
    ttl: SESSION_TTL_SECONDS,
    autoRemove: "native", // Auto-remove expired sessions
    touchAfter: 24 * 3600, // Lazy session update (update session once per 24 hours)
  }),
  cookie: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    maxAge: SESSION_MAX_AGE_MS,
  },
});

export default sessionConfig;
