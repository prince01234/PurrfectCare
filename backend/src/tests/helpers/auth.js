import { createJWT } from "../../utils/jwt.js";

const buildAuthUserPayload = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  roles: user.roles,
  isVerified: user.isVerified,
  hasCompletedOnboarding: user.hasCompletedOnboarding || false,
  userIntent: user.userIntent || null,
});

const createAuthToken = (user) => createJWT(buildAuthUserPayload(user));

const bearerToken = (user) => `Bearer ${createAuthToken(user)}`;

export { buildAuthUserPayload, createAuthToken, bearerToken };
