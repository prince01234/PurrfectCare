import { verifyJWT } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Basic authentication middleware
 * Checks if user is logged in (token valid)
 */
const auth = async (req, res, next) => {
  let authToken;

  // Try Bearer token first (Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    authToken = authHeader.split(" ")[1];
  }
  // Try cookies second (from cookieParser middleware)
  else if (req.cookies && req.cookies.authToken) {
    authToken = req.cookies.authToken;
  }
  // If no token found
  else {
    return res
      .status(401)
      .send({ error: "User not authenticated. Please login first." });
  }

  try {
    const data = await verifyJWT(authToken);
    req.user = data;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res
      .status(401)
      .send({ error: "Invalid or expired token. Please login again." });
  }
};

/**
 * Optional authentication middleware
 * Allows both authenticated and unauthenticated users
 * Use for browsing/viewing content
 */
const optionalAuth = async (req, res, next) => {
  let authToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    authToken = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.authToken) {
    authToken = req.cookies.authToken;
  }

  if (authToken) {
    try {
      const data = await verifyJWT(authToken);
      req.user = data;
    } catch (error) {
      // Token invalid but that's okay for optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

/**
 * Verification required middleware
 * Must be used AFTER auth middleware
 * Blocks unverified users from performing actions
 */
const requireVerified = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .send({ error: "User not authenticated. Please login first." });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        error:
          "Email verification required. Please verify your email to perform this action.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    // Attach fresh user data to request
    req.verifiedUser = user;
    next();
  } catch (error) {
    console.error("Verification check error:", error.message);
    res.status(500).send({ error: "Failed to verify user status." });
  }
};

/**
 * Role-based authorization middleware
 * Must be used AFTER auth middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .send({ error: "User not authenticated. Please login first." });
    }

    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).send({ error: "User not found." });
      }

      if (!allowedRoles.includes(user.roles)) {
        return res.status(403).send({
          error:
            "Access denied. You do not have permission to perform this action.",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      req.authorizedUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error.message);
      res.status(500).send({ error: "Failed to verify user role." });
    }
  };
};

export default auth;
export { auth, optionalAuth, requireVerified, requireRole };
