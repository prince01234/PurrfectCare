import User from "../models/User.js";
import AdoptionListing from "../models/AdoptionListing.js";
import { ADMIN } from "../constants/roles.js";

/**
 * Get all approved service providers that have valid coordinates.
 * Optionally filter by serviceType.
 */
const getProviderLocations = async (queryParams = {}) => {
  const { serviceType } = queryParams;

  const filter = {
    roles: ADMIN,
    latitude: { $ne: null },
    longitude: { $ne: null },
    isActive: true,
  };

  // Exclude marketplace providers from map (per user requirement)
  if (serviceType) {
    filter.serviceType = serviceType.toLowerCase();
  } else {
    filter.serviceType = { $ne: "marketplace" };
  }

  const providers = await User.find(filter).select(
    "name profileImage serviceType organizationName contactPhone contactAddress latitude longitude",
  );

  return providers;
};

/**
 * Get all adoption listings that have valid coordinates.
 */
const getAdoptionLocations = async () => {
  const filter = {
    isDeleted: false,
    status: "available",
    latitude: { $ne: null },
    longitude: { $ne: null },
  };

  const listings = await AdoptionListing.find(filter)
    .select(
      "name species breed gender age location latitude longitude photos postedBy",
    )
    .populate("postedBy", "name organizationName profileImage");

  return listings;
};

export default {
  getProviderLocations,
  getAdoptionLocations,
};
