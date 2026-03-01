import AdoptionApplication, {
  isValidObjectId,
} from "../models/AdoptionApplication.js";
import AdoptionListing from "../models/AdoptionListing.js";
import Pet from "../models/Pet.js";
import { APPLICATION_STATUS, LISTING_STATUS } from "../constants/adoption.js";
import adoptionListingService from "./adoptionListingService.js";

// Submit an adoption application
const createApplication = async (applicantId, listingId, data) => {
  if (!isValidObjectId(listingId)) {
    throw { statusCode: 400, message: "Invalid listing ID" };
  }

  // Verify listing exists and is available
  const listing = await AdoptionListing.findById(listingId);
  if (!listing || listing.isDeleted) {
    throw { statusCode: 404, message: "Listing not found" };
  }

  if (listing.status !== LISTING_STATUS.AVAILABLE) {
    throw {
      statusCode: 400,
      message: "This pet is no longer available for adoption",
    };
  }

  // Prevent applying to own listing
  if (listing.postedBy.toString() === applicantId.toString()) {
    throw {
      statusCode: 400,
      message: "You cannot apply for your own listing",
    };
  }

  // Prevent duplicate applications
  const existingApplication = await AdoptionApplication.findOne({
    listingId,
    applicantId,
  });
  if (existingApplication) {
    throw {
      statusCode: 400,
      message: "You have already applied for this pet",
    };
  }

  // Strip fields that must not be set by the client
  const {
    status: _status,
    reviewedAt: _reviewedAt,
    reviewNotes: _reviewNotes,
    applicantId: _applicantId,
    listingId: _listingId,
    ...safeData
  } = data;

  const application = await AdoptionApplication.create({
    ...safeData,
    listingId,
    applicantId,
  });

  return application;
};

// Get applications for a listing (listing owner only)
const getApplicationsByListing = async (
  listingId,
  userId,
  queryParams = {},
) => {
  // Verify ownership
  await adoptionListingService.verifyListingOwnership(listingId, userId);

  const {
    page = 1,
    limit = 10,
    status,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  const filter = { listingId };

  if (status) {
    filter.status = status.toLowerCase();
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const applications = await AdoptionApplication.find(filter)
    .populate("applicantId", "name email profileImage")
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await AdoptionApplication.countDocuments(filter);

  return {
    applications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get a single application by ID (listing owner or applicant)
const getApplicationById = async (applicationId, userId) => {
  if (!isValidObjectId(applicationId)) {
    throw { statusCode: 400, message: "Invalid application ID" };
  }

  const application = await AdoptionApplication.findById(applicationId)
    .populate("applicantId", "name email profileImage phoneNumber")
    .populate({
      path: "listingId",
      select: "name species breed photos status postedBy",
    });

  if (!application) {
    throw { statusCode: 404, message: "Application not found" };
  }

  // Allow access if the user is the applicant or the listing owner
  const isApplicant =
    application.applicantId._id.toString() === userId.toString();
  const isListingOwner =
    application.listingId.postedBy.toString() === userId.toString();

  if (!isApplicant && !isListingOwner) {
    throw {
      statusCode: 403,
      message:
        "Access denied. You do not have permission to view this application.",
    };
  }

  return application;
};

// Approve an application (listing owner only)
const approveApplication = async (applicationId, userId, reviewNotes) => {
  if (!isValidObjectId(applicationId)) {
    throw { statusCode: 400, message: "Invalid application ID" };
  }

  const application = await AdoptionApplication.findById(applicationId);
  if (!application) {
    throw { statusCode: 404, message: "Application not found" };
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw {
      statusCode: 400,
      message: `Cannot approve an application that is already ${application.status}`,
    };
  }

  // Verify listing ownership
  const listing = await adoptionListingService.verifyListingOwnership(
    application.listingId,
    userId,
  );

  if (listing.status === LISTING_STATUS.ADOPTED) {
    throw {
      statusCode: 400,
      message: "This pet has already been adopted",
    };
  }

  // 1. Approve this application
  application.status = APPLICATION_STATUS.APPROVED;
  application.reviewedAt = new Date();
  if (reviewNotes) application.reviewNotes = reviewNotes;
  await application.save();

  // 2. Mark the listing as adopted
  await AdoptionListing.findByIdAndUpdate(application.listingId, {
    status: LISTING_STATUS.ADOPTED,
    adoptedBy: application.applicantId,
    adoptedAt: new Date(),
  });

  // 3. Reject all other pending applications for this listing
  await AdoptionApplication.updateMany(
    {
      listingId: application.listingId,
      _id: { $ne: applicationId },
      status: APPLICATION_STATUS.PENDING,
    },
    {
      status: APPLICATION_STATUS.REJECTED,
      reviewedAt: new Date(),
      reviewNotes: "Another application was approved for this pet.",
    },
  );

  // 4. Auto-create a Pet record for the adopter from the listing details
  // Listing age is in months — convert to years for the Pet model
  const ageInMonths = listing.age || 0;
  const ageInYears = Math.round((ageInMonths / 12) * 10) / 10; // e.g. 30 months → 2.5

  // Estimate date of birth from age in months
  const estimatedDob = ageInMonths
    ? new Date(new Date().getFullYear(), new Date().getMonth() - ageInMonths, 1)
    : null;

  await Pet.create({
    userId: application.applicantId,
    name: listing.name,
    species: listing.species,
    breed: listing.breed || null,
    gender: listing.gender,
    age: ageInYears || null,
    dateOfBirth: estimatedDob,
    photos: listing.photos || [],
    medicalNotes:
      [listing.healthInfo, listing.specialNeeds].filter(Boolean).join("\n") ||
      null,
  });

  return application;
};

// Reject an application (listing owner only)
const rejectApplication = async (applicationId, userId, reviewNotes) => {
  if (!isValidObjectId(applicationId)) {
    throw { statusCode: 400, message: "Invalid application ID" };
  }

  const application = await AdoptionApplication.findById(applicationId);
  if (!application) {
    throw { statusCode: 404, message: "Application not found" };
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw {
      statusCode: 400,
      message: `Cannot reject an application that is already ${application.status}`,
    };
  }

  // Verify listing ownership
  await adoptionListingService.verifyListingOwnership(
    application.listingId,
    userId,
  );

  application.status = APPLICATION_STATUS.REJECTED;
  application.reviewedAt = new Date();
  if (reviewNotes) application.reviewNotes = reviewNotes;
  await application.save();

  return application;
};

// Get current user's own applications
const getMyApplications = async (userId, queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  const filter = { applicantId: userId };

  if (status) {
    filter.status = status.toLowerCase();
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const applications = await AdoptionApplication.find(filter)
    .populate({
      path: "listingId",
      select: "name species breed gender age photos status location postedBy",
      populate: { path: "postedBy", select: "name" },
    })
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await AdoptionApplication.countDocuments(filter);

  return {
    applications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Admin: Get ALL adoption applications across all listings
const getAllApplications = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  const filter = {};
  if (status) {
    filter.status = status.toLowerCase();
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const applications = await AdoptionApplication.find(filter)
    .populate("applicantId", "name email profileImage phoneNumber")
    .populate({
      path: "listingId",
      select: "name species breed gender age photos status location postedBy",
      populate: { path: "postedBy", select: "name" },
    })
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await AdoptionApplication.countDocuments(filter);

  return {
    applications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Admin: Get dashboard stats for adoption module
const getAdoptionStats = async (userId) => {
  // Get listings by this admin
  const totalListings = await AdoptionListing.countDocuments({
    postedBy: userId,
    isDeleted: false,
  });
  const availableListings = await AdoptionListing.countDocuments({
    postedBy: userId,
    isDeleted: false,
    status: LISTING_STATUS.AVAILABLE,
  });
  const adoptedListings = await AdoptionListing.countDocuments({
    postedBy: userId,
    isDeleted: false,
    status: LISTING_STATUS.ADOPTED,
  });

  // Get all listing IDs for this admin
  const listingIds = await AdoptionListing.find({
    postedBy: userId,
    isDeleted: false,
  }).select("_id");
  const ids = listingIds.map((l) => l._id);

  const totalApplications = await AdoptionApplication.countDocuments({
    listingId: { $in: ids },
  });
  const pendingApplications = await AdoptionApplication.countDocuments({
    listingId: { $in: ids },
    status: APPLICATION_STATUS.PENDING,
  });
  const approvedApplications = await AdoptionApplication.countDocuments({
    listingId: { $in: ids },
    status: APPLICATION_STATUS.APPROVED,
  });
  const rejectedApplications = await AdoptionApplication.countDocuments({
    listingId: { $in: ids },
    status: APPLICATION_STATUS.REJECTED,
  });

  return {
    listings: {
      total: totalListings,
      available: availableListings,
      adopted: adoptedListings,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
    },
  };
};

export default {
  createApplication,
  getApplicationsByListing,
  getApplicationById,
  approveApplication,
  rejectApplication,
  getMyApplications,
  getAllApplications,
  getAdoptionStats,
};
