import { verifyJWT } from "../utils/jwt.js";

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
    return res.status(401).send("User not authenticated. Please login first.");
  }

  try {
    const data = await verifyJWT(authToken);
    req.user = data;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).send("Invalid or expired token. Please login again.");
  }
};

export default auth;
