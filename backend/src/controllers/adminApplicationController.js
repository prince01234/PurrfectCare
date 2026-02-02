import adminApplicationService from "../services/adminApplicationService.js";

// User applies to become service provider (admin)
const applyAsAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const application = await adminApplicationService.applyAsAdmin(
      userId,
      req.body,
    );

    res.status(201).send({
      message:
        "Service provider application submitted successfully. SUPER_ADMIN will review your application.",
      application,
    });
  } catch (error) {
    console.error("Error applying as service provider:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to apply as service provider";
    res.status(statusCode).send({ error: message });
  }
};

// Get user's own application
const getMyApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const application = await adminApplicationService.getMyApplication(userId);
    res.status(200).send(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch application";
    res.status(statusCode).send({ error: message });
  }
};

// Get all applications (SUPER_ADMIN only)
const getAllApplications = async (req, res) => {
  try {
    const result = await adminApplicationService.getAllApplications(req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching applications:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch applications";
    res.status(statusCode).send({ error: message });
  }
};

// Approve application (SUPER_ADMIN only)
const approveApplication = async (req, res) => {
  try {
    const superAdminId = req.user._id;
    const { reviewNotes } = req.body;

    const application = await adminApplicationService.approveApplication(
      req.params.id,
      superAdminId,
      reviewNotes,
    );

    res.status(200).send({
      message:
        "Service provider application approved! User role has been updated to ADMIN with their service type.",
      application,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to approve application";
    res.status(statusCode).send({ error: message });
  }
};

// Reject application (SUPER_ADMIN only)
const rejectApplication = async (req, res) => {
  try {
    const superAdminId = req.user._id;
    const { rejectionReason } = req.body;

    const application = await adminApplicationService.rejectApplication(
      req.params.id,
      superAdminId,
      rejectionReason,
    );

    res.status(200).send({
      message: "Service provider application rejected.",
      application,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to reject application";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  applyAsAdmin,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
};
