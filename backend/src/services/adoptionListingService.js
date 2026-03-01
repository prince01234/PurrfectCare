import AdoptionListing, { isValidObjectId } from "../models/AdoptionListing.js";
import AdminApplication from "../models/AdminApplication.js";
import User from "../models/User.js";
import { LISTING_STATUS } from "../constants/adoption.js";
import { SUPER_ADMIN } from "../constants/roles.js";

// Verify listing ownership (creator or super admin)
const verifyListingOwnership = async (listingId, userId) => {
  if (!isValidObjectId(listingId)) {
    throw { statusCode: 400, message: "Invalid listing ID" };
  }

  const listing = await AdoptionListing.findById(listingId);
  if (!listing || listing.isDeleted) {
    throw { statusCode: 404, message: "Listing not found" };
  }

  // Check if admin is the creator or super admin
  const user = await User.findById(userId);
  const isOwner = listing.postedBy.toString() === userId.toString();
  const isSuperAdmin = user && user.roles === SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    throw {
      statusCode: 403,
      message: "Access denied. You can only manage your own listings.",
    };
  }

  return listing;
};

// Create a new adoption listing (Admin only — role checked at route level)
const createListing = async (userId, data, files) => {
  // Strip fields that must not be set by the client
  const {
    postedBy,
    status,
    adoptedBy,
    adoptedAt,
    isDeleted,
    deletedAt,
    photos: _photos,
    ...safeData
  } = data;

  // Upload photos if provided
  let photoUrls = [];
  if (files && files.length > 0) {
    const { uploadFile } = await import("../utils/file.js");
    photoUrls = await uploadFile(files);
  }

  const listing = await AdoptionListing.create({
    ...safeData,
    postedBy: userId,
    photos: photoUrls,
  });

  return listing;
};

// Get all available adoption listings (Public)
const getListings = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 12,
    search,
    species,
    gender,
    minAge,
    maxAge,
    location,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  // Build filter — only available, non-deleted listings for public
  const filter = {
    status: LISTING_STATUS.AVAILABLE,
    isDeleted: false,
  };

  // Search by name, breed, or description
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { breed: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (species) {
    filter.species = species.toLowerCase();
  }

  if (gender) {
    filter.gender = gender.toLowerCase();
  }

  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = parseInt(minAge);
    if (maxAge) filter.age.$lte = parseInt(maxAge);
  }

  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const listings = await AdoptionListing.find(filter)
    .populate("postedBy", "name profileImage")
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await AdoptionListing.countDocuments(filter);

  return {
    listings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get a single listing by ID (Public — only if available and not deleted)
const getListingById = async (listingId) => {
  if (!isValidObjectId(listingId)) {
    throw { statusCode: 400, message: "Invalid listing ID" };
  }

  const listing = await AdoptionListing.findById(listingId).populate(
    "postedBy",
    "name profileImage phoneNumber",
  );

  if (!listing || listing.isDeleted) {
    throw { statusCode: 404, message: "Listing not found" };
  }

  // Attach organizationName from the poster's approved admin application
  const listingObj = listing.toObject();
  const adminApp = await AdminApplication.findOne({
    userId: listing.postedBy._id,
    status: "approved",
  }).select("organizationName");

  if (adminApp) {
    listingObj.postedBy.organizationName = adminApp.organizationName;
  }

  return listingObj;
};

// Update an adoption listing (owner only)
const updateListing = async (listingId, userId, data, files) => {
  const listing = await verifyListingOwnership(listingId, userId);

  if (listing.status === LISTING_STATUS.ADOPTED) {
    throw {
      statusCode: 400,
      message: "Cannot edit a listing that has already been adopted",
    };
  }

  // Upload new photos if provided
  let photoUrls = [];
  if (files && files.length > 0) {
    const { uploadFile } = await import("../utils/file.js");
    photoUrls = await uploadFile(files);
  }

  // Remove fields that should not be updated directly
  const {
    postedBy,
    _id,
    status,
    adoptedBy,
    adoptedAt,
    isDeleted,
    deletedAt,
    ...updateData
  } = data;

  if (photoUrls.length > 0) {
    updateData.photos = photoUrls;
  }

  const updatedListing = await AdoptionListing.findByIdAndUpdate(
    listingId,
    updateData,
    { new: true, runValidators: true },
  );

  return updatedListing;
};

// Soft delete a listing (owner only)
const deleteListing = async (listingId, userId) => {
  const listing = await verifyListingOwnership(listingId, userId);

  const deletedListing = await AdoptionListing.findByIdAndUpdate(
    listingId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  return deletedListing;
};

// Get listings by the current admin (owner's own listings — role checked at route level)
const getMyListings = async (userId, queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  const filter = { postedBy: userId, isDeleted: false };

  if (status) {
    filter.status = status.toLowerCase();
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const listings = await AdoptionListing.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await AdoptionListing.countDocuments(filter);

  return {
    listings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export default {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  verifyListingOwnership,
};
