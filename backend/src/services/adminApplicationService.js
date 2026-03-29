import AdminApplication from "../models/AdminApplication.js";
import User from "../models/User.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";
import mongoose from "mongoose";
import inAppNotificationService from "./inAppNotificationService.js";

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

  await inAppNotificationService.createNotification({
    userId,
    type: "application",
    title: "Application submitted",
    body: "Your service provider application has been submitted for review.",
    entityId: application._id.toString(),
    entityType: "admin_application",
    data: {
      applicationId: application._id.toString(),
      serviceType: application.serviceType,
      status: application.status,
    },
  });

  const [applicant, superAdmins] = await Promise.all([
    User.findById(userId).select("name"),
    User.find({ roles: SUPER_ADMIN, isActive: true }).select("_id"),
  ]);

  if (superAdmins.length > 0) {
    await inAppNotificationService.createManyNotifications(
      superAdmins.map((admin) => ({
        userId: admin._id.toString(),
        type: "application",
        title: "New service provider application",
        body: `${applicant?.name || "A user"} submitted an application for ${application.serviceType.replace("_", " ")}.`,
        entityId: application._id.toString(),
        entityType: "admin_application",
        data: {
          applicationId: application._id.toString(),
          applicantId: userId.toString(),
          applicantName: applicant?.name || "Unknown user",
          serviceType: application.serviceType,
          status: application.status,
        },
      })),
    );
  }

  return application;
};

// Get user's own application
const getMyApplication = async (userId) => {
  // Return the most recent application (important for users who reapply after rejection)
  const application = await AdminApplication.findOne({ userId }).sort({
    createdAt: -1,
  });

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

  // Update user: set role to ADMIN, serviceType, and provider info
  const updateData = {
    roles: ADMIN,
    serviceType: application.serviceType,
    organizationName: application.organizationName,
    contactPhone: application.contactPhone,
    contactAddress: application.contactAddress,
  };

  // Copy location coordinates if available
  if (application.latitude != null && application.longitude != null) {
    updateData.latitude = application.latitude;
    updateData.longitude = application.longitude;
  }

  await User.findByIdAndUpdate(application.userId, updateData);

  // Update application
  application.status = "approved";
  application.reviewedBy = superAdminId;
  application.reviewNotes = reviewNotes;
  await application.save();

  await inAppNotificationService.createNotification({
    userId: application.userId.toString(),
    type: "application",
    title: "Application approved",
    body: "Your service provider application was approved.",
    entityId: application._id.toString(),
    entityType: "admin_application",
    data: {
      applicationId: application._id.toString(),
      serviceType: application.serviceType,
      status: application.status,
    },
  });

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

  await inAppNotificationService.createNotification({
    userId: application.userId.toString(),
    type: "application",
    title: "Application rejected",
    body: rejectionReason,
    entityId: application._id.toString(),
    entityType: "admin_application",
    data: {
      applicationId: application._id.toString(),
      serviceType: application.serviceType,
      status: application.status,
    },
  });

  return application;
};

export default {
  applyAsAdmin,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
};
