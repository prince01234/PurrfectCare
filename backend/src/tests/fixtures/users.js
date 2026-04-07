import { ADMIN, USER } from "../../constants/roles.js";

const basePassword = "Password123!";

const userFixtures = {
  normalAuthenticatedUser: {
    name: "Normal Auth User",
    email: "normal.auth@example.com",
    roles: USER,
    isVerified: true,
    isActive: true,
    password: basePassword,
  },
  verifiedUser: {
    name: "Verified User",
    email: "verified.user@example.com",
    roles: USER,
    isVerified: true,
    isActive: true,
    password: basePassword,
  },
  unverifiedUser: {
    name: "Unverified User",
    email: "unverified.user@example.com",
    roles: USER,
    isVerified: false,
    isActive: true,
    password: basePassword,
  },
  bannedUser: {
    name: "Banned User",
    email: "banned.user@example.com",
    roles: USER,
    isVerified: true,
    isActive: false,
    password: basePassword,
  },
  adminUser: {
    name: "Admin User",
    email: "admin.user@example.com",
    roles: ADMIN,
    serviceType: "pet_adoption",
    isVerified: true,
    isActive: true,
    password: basePassword,
  },
  providerUser: {
    name: "Provider User",
    email: "provider.user@example.com",
    roles: ADMIN,
    serviceType: "veterinary",
    isVerified: true,
    isActive: true,
    password: basePassword,
  },
  merchantUser: {
    name: "Merchant User",
    email: "merchant.user@example.com",
    roles: ADMIN,
    serviceType: "marketplace",
    isVerified: true,
    isActive: true,
    password: basePassword,
  },
};

export { basePassword, userFixtures };
