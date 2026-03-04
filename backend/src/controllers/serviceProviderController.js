import serviceProviderService from "../services/serviceProviderService.js";
import { uploadFile } from "../utils/file.js";

// Create service provider profile
const createProvider = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = { ...req.body };

    // Parse JSON fields if sent as strings (from FormData)
    if (typeof data.availability === "string") {
      data.availability = JSON.parse(data.availability);
    }
    if (typeof data.serviceOptions === "string") {
      data.serviceOptions = JSON.parse(data.serviceOptions);
    }
    if (typeof data.amenities === "string") {
      data.amenities = JSON.parse(data.amenities);
    }

    // Handle image uploads
    if (req.files) {
      if (req.files.image?.[0]) {
        const uploaded = await uploadFile([req.files.image[0]]);
        data.image = uploaded[0];
      }
      if (req.files.coverImage?.[0]) {
        const uploaded = await uploadFile([req.files.coverImage[0]]);
        data.coverImage = uploaded[0];
      }
    }

    const provider = await serviceProviderService.createProvider(userId, data);
    res.status(201).send(provider);
  } catch (error) {
    console.error("Error creating provider:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create provider profile";
    res.status(statusCode).send({ error: message });
  }
};

// Get my provider profile
const getMyProvider = async (req, res) => {
  try {
    const provider = await serviceProviderService.getMyProvider(req.user._id);
    res.status(200).send(provider);
  } catch (error) {
    console.error("Error fetching provider profile:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch provider profile";
    res.status(statusCode).send({ error: message });
  }
};

// Get all providers (public)
const getProviders = async (req, res) => {
  try {
    const result = await serviceProviderService.getProviders(req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching providers:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch providers";
    res.status(statusCode).send({ error: message });
  }
};

// Get single provider by ID (public)
const getProviderById = async (req, res) => {
  try {
    const provider = await serviceProviderService.getProviderById(
      req.params.id,
    );
    res.status(200).send(provider);
  } catch (error) {
    console.error("Error fetching provider:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch provider";
    res.status(statusCode).send({ error: message });
  }
};

// Update provider profile
const updateProvider = async (req, res) => {
  try {
    const data = { ...req.body };

    // Parse JSON fields if sent as strings (from FormData)
    if (typeof data.availability === "string") {
      data.availability = JSON.parse(data.availability);
    }
    if (typeof data.serviceOptions === "string") {
      data.serviceOptions = JSON.parse(data.serviceOptions);
    }
    if (typeof data.amenities === "string") {
      data.amenities = JSON.parse(data.amenities);
    }

    // Handle image uploads
    if (req.files) {
      if (req.files.image?.[0]) {
        const uploaded = await uploadFile([req.files.image[0]]);
        data.image = uploaded[0];
      }
      if (req.files.coverImage?.[0]) {
        const uploaded = await uploadFile([req.files.coverImage[0]]);
        data.coverImage = uploaded[0];
      }
    }

    const provider = await serviceProviderService.updateProvider(
      req.user._id,
      data,
    );
    res.status(200).send(provider);
  } catch (error) {
    console.error("Error updating provider:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update provider profile";
    res.status(statusCode).send({ error: message });
  }
};

// Delete provider profile
const deleteProvider = async (req, res) => {
  try {
    await serviceProviderService.deleteProvider(req.user._id);
    res.status(200).send({ message: "Provider profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting provider:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete provider profile";
    res.status(statusCode).send({ error: message });
  }
};

// Upload image for a specific service option
const uploadServiceOptionImage = async (req, res) => {
  try {
    const { optionId } = req.params;
    const provider = await serviceProviderService.getMyProvider(req.user._id);

    const optionIndex = provider.serviceOptions.findIndex(
      (o) => o._id.toString() === optionId,
    );
    if (optionIndex === -1) {
      return res.status(404).send({ error: "Service option not found" });
    }

    if (!req.file) {
      return res.status(400).send({ error: "No image file provided" });
    }

    const uploaded = await uploadFile([req.file]);
    provider.serviceOptions[optionIndex].image = uploaded[0];
    await provider.save();

    res.status(200).send(provider);
  } catch (error) {
    console.error("Error uploading service option image:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to upload image";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createProvider,
  getMyProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  uploadServiceOptionImage,
};
