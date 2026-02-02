import AdminApplication from "../models/AdminApplication.js";
import User from "../models/User.js";
import { ADMIN } from "../constants/roles.js";
import mongoose from "mongoose";

const isValidObjectId = mongoose.Types.ObjectId.isValid;

// User applies to become service provider (admin)
const applyAsAdmin = async (userId, data) => {
  // Check if user already has pending or approved application
  const existingApp = await AdminApplication.findOne({
    userId,
    status: { $in: ["pending", "approved"] },
  });

  if (existingApp) {
    if (existingApp.status === "approved") {
      throw {
        statusCode: 400,
        message: "You are already an approved service provider",
      };
    }
    throw {
      statusCode: 400,
      message: "You already have a pending application",
    };
  }

  // Create application
  const application = await AdminApplication.create({
    userId,
    ...data,
  });

  return application;
};

// Get user's own application
const getMyApplication = async (userId) => {
  const application = await AdminApplication.findOne({ userId });

  if (!application) {
    throw { statusCode: 404, message: "No application found" };
  }

  return application;
};

// Get all applications (SUPER_ADMIN only)
const getAllApplications = async (queryParams = {}) => {
  const { page = 1, limit = 10, status, serviceType } = queryParams;

  const filter = {};

  if (status) {
    filter.status = status.toLowerCase();
  }

  if (serviceType) {
    filter.serviceType = serviceType.toLowerCase();
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const applications = await AdminApplication.find(filter)
    .populate("userId", "name email phoneNumber")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await AdminApplication.countDocuments(filter);

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

// Approve application (SUPER_ADMIN only)
const approveApplication = async (
  applicationId,
  superAdminId,
  reviewNotes = null,
) => {
  if (!isValidObjectId(applicationId)) {
    throw { statusCode: 400, message: "Invalid application ID" };
  }

  const application = await AdminApplication.findById(applicationId);

  if (!application) {
    throw { statusCode: 404, message: "Application not found" };
  }

  if (application.status !== "pending") {
    throw {
      statusCode: 400,
      message: `Cannot approve application with status "${application.status}"`,
    };
  }

  // Update user: set role to ADMIN and serviceType
  await User.findByIdAndUpdate(application.userId, {
    roles: ADMIN,
    serviceType: application.serviceType,
  });

  // Update application
  application.status = "approved";
  application.reviewedBy = superAdminId;
  application.reviewNotes = reviewNotes;
  await application.save();

  return application;
};

// Reject application (SUPER_ADMIN only)
const rejectApplication = async (
  applicationId,
  superAdminId,
  rejectionReason,
) => {
  if (!isValidObjectId(applicationId)) {
    throw { statusCode: 400, message: "Invalid application ID" };
  }

  if (!rejectionReason) {
    throw { statusCode: 400, message: "Rejection reason is required" };
  }

  const application = await AdminApplication.findById(applicationId);

  if (!application) {
    throw { statusCode: 404, message: "Application not found" };
  }

  if (application.status !== "pending") {
    throw {
      statusCode: 400,
      message: `Cannot reject application with status "${application.status}"`,
    };
  }

  // Update application
  application.status = "rejected";
  application.reviewedBy = superAdminId;
  application.rejectionReason = rejectionReason;
  await application.save();

  return application;
};

export default {
  applyAsAdmin,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
};
