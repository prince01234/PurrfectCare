import adoptionListingService from "../services/adoptionListingService.js";
import { uploadFile } from "../utils/file.js";

// Get all available listings (Public)
const getListings = async (req, res) => {
  try {
    const result = await adoptionListingService.getListings(req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching adoption listings:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch listings";
    res.status(statusCode).send({ error: message });
  }
};

// Get single listing by ID (Public)
const getListingById = async (req, res) => {
  try {
    const listing = await adoptionListingService.getListingById(req.params.id);
    res.status(200).send(listing);
  } catch (error) {
    console.error("Error fetching adoption listing:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch listing";
    res.status(statusCode).send({ error: message });
  }
};

// Create a new listing (Admin only)
const createListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = { ...req.body };

    const listing = await adoptionListingService.createListing(
      userId,
      data,
      req.files,
    );
    res.status(201).send(listing);
  } catch (error) {
    console.error("Error creating adoption listing:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create listing";
    res.status(statusCode).send({ error: message });
  }
};

// Update a listing (Admin only)
const updateListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = { ...req.body };

    const listing = await adoptionListingService.updateListing(
      req.params.id,
      userId,
      data,
      req.files,
    );
    res.status(200).send(listing);
  } catch (error) {
    console.error("Error updating adoption listing:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update listing";
    res.status(statusCode).send({ error: message });
  }
};

// Delete a listing - soft delete (Admin only)
const deleteListing = async (req, res) => {
  try {
    const userId = req.user._id;
    await adoptionListingService.deleteListing(req.params.id, userId);
    res.status(200).send({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting adoption listing:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete listing";
    res.status(statusCode).send({ error: message });
  }
};

// Get admin listings (includes adopted/inactive)
const getMyListings = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await adoptionListingService.getMyListings(
      userId,
      req.query,
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching my adoption listings:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch your listings";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
};
