import adoptionApplicationService from "../services/adoptionApplicationService.js";

// Submit an adoption application (logged-in user)
const createApplication = async (req, res) => {
  try {
    const applicantId = req.user._id;
    const { listingId } = req.params;
    const data = { ...req.body };

    const application = await adoptionApplicationService.createApplication(
      applicantId,
      listingId,
      data,
    );
    res.status(201).send(application);
  } catch (error) {
    console.error("Error creating adoption application:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    // Handle duplicate key (unique index on listingId + applicantId)
    if (error.code === 11000) {
      return res
        .status(400)
        .send({ error: "You have already applied for this pet" });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to submit application";
    res.status(statusCode).send({ error: message });
  }
};

// Get applications for a specific listing (listing owner only)
const getApplicationsByListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listingId } = req.params;

    const result = await adoptionApplicationService.getApplicationsByListing(
      listingId,
      userId,
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching applications:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch applications";
    res.status(statusCode).send({ error: message });
  }
};

// Get a single application by ID (applicant or listing owner)
const getApplicationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const application = await adoptionApplicationService.getApplicationById(
      req.params.id,
      userId,
    );
    res.status(200).send(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch application";
    res.status(statusCode).send({ error: message });
  }
};

// Approve an application (listing owner only)
const approveApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewNotes } = req.body;

    const application = await adoptionApplicationService.approveApplication(
      req.params.id,
      userId,
      reviewNotes,
    );
    res.status(200).send({
      message:
        "Application approved successfully. Pet has been marked as adopted.",
      application,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to approve application";
    res.status(statusCode).send({ error: message });
  }
};

// Reject an application (listing owner only)
const rejectApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewNotes } = req.body;

    const application = await adoptionApplicationService.rejectApplication(
      req.params.id,
      userId,
      reviewNotes,
    );
    res.status(200).send({
      message: "Application rejected successfully.",
      application,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to reject application";
    res.status(statusCode).send({ error: message });
  }
};

// Get current user's own applications
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await adoptionApplicationService.getMyApplications(
      userId,
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching my applications:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch your applications";
    res.status(statusCode).send({ error: message });
  }
};

// Admin: Get ALL adoption applications (across all listings)
const getAllApplications = async (req, res) => {
  try {
    const result = await adoptionApplicationService.getAllApplications(
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching all applications:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch applications";
    res.status(statusCode).send({ error: message });
  }
};

// Admin: Get adoption stats for dashboard
const getAdoptionStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await adoptionApplicationService.getAdoptionStats(userId);
    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching adoption stats:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch adoption stats";
    res.status(statusCode).send({ error: message });
  }
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
