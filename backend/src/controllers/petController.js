import petService from "../services/petService.js";

const createPet = async (req, res) => {
  try {
    // userId is automatically taken from logged-in user (auth middleware)
    const userId = req.user._id;

    // Validate files if provided
    if (req.files && req.files.length > 0) {
      const validationError = validatePetPhotos(req.files);
      if (validationError) {
        return res.status(400).send({ error: validationError });
      }
    }

    const pet = await petService.createPet(userId, req.body, req.files);

    res.status(201).send(pet);
  } catch (error) {
    console.error("Error creating pet:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create pet";
    res.status(statusCode).send({ error: message });
  }
};

const getPets = async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract query parameters
    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      species: req.query.species,
      name: req.query.name,
      breed: req.query.breed,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
    };

    const result = await petService.getPetsByUserId(userId, queryParams);

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching pets:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch pets";
    res.status(statusCode).send({ error: message });
  }
};

const getPetById = async (req, res) => {
  try {
    const userId = req.user._id;
    const pet = await petService.getPetById(req.params.id, userId);

    res.status(200).send(pet);
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch pet by ID";
    res.status(statusCode).send({ error: message });
  }
};

const updatePet = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;

    // Validate files if provided
    if (req.files && req.files.length > 0) {
      const validationError = validatePetPhotos(req.files);
      if (validationError) {
        return res.status(400).send({ error: validationError });
      }
    }

    const updatedPet = await petService.updatePet(
      petId,
      userId,
      req.body,
      req.files,
    );

    res.status(200).send(updatedPet);
  } catch (error) {
    console.error("Error updating pet:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update pet";
    res.status(statusCode).send({ error: message });
  }
};

const addPetPhotos = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ error: "No photos provided" });
    }

    const validationError = validatePetPhotos(req.files);
    if (validationError) {
      return res.status(400).send({ error: validationError });
    }

    const updatedPet = await petService.addPetPhotos(petId, userId, req.files);

    res.status(200).send({
      message: "Photos added successfully",
      pet: updatedPet,
    });
  } catch (error) {
    console.error("Error adding pet photos:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to add photos";
    res.status(statusCode).send({ error: message });
  }
};

const deletePetPhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;
    const { photoUrl } = req.body;

    const updatedPet = await petService.deletePetPhoto(petId, userId, photoUrl);

    res.status(200).send({
      message: "Photo deleted successfully",
      pet: updatedPet,
    });
  } catch (error) {
    console.error("Error deleting pet photo:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete photo";
    res.status(statusCode).send({ error: message });
  }
};

const deletePet = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;

    const deletedPet = await petService.deletePet(petId, userId);

    res.status(200).json({
      message: `Pet ${deletedPet.name} with id: ${deletedPet._id} soft deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting pet:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete pet";
    res.status(statusCode).send({ error: message });
  }
};

const permanentlyDeletePet = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;

    const deletedPet = await petService.permanentlyDeletePet(petId, userId);

    res.status(200).json({
      message: `Pet ${deletedPet.name} permanently deleted along with all photos`,
    });
  } catch (error) {
    console.error("Error permanently deleting pet:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to permanently delete pet";
    res.status(statusCode).send({ error: message });
  }
};

const restorePet = async (req, res) => {
  try {
    const userId = req.user._id;
    const petId = req.params.id;
    const restoredPet = await petService.restorePet(petId, userId);

    res.status(200).json({
      message: `Pet ${restoredPet.name} restored successfully`,
      pet: restoredPet,
    });
  } catch (error) {
    console.error("Error restoring pet:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to restore pet";
    res.status(statusCode).send({ error: message });
  }
};

const getPetStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await petService.getPetStatistics(userId);

    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching pet statistics:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch pet statistics";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Helper function to validate pet photo files
 */
const validatePetPhotos = (files) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 10;

  if (files.length > maxFiles) {
    return `Maximum ${maxFiles} photos allowed at once`;
  }

  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return `Invalid file type: ${file.originalname}. Only JPEG, PNG, GIF, and WebP are allowed`;
    }

    if (file.size > maxSize) {
      return `File too large: ${file.originalname}. Maximum size is 5MB`;
    }
  }

  return null;
};

export default {
  createPet,
  getPets,
  getPetById,
  updatePet,
  addPetPhotos,
  deletePetPhoto,
  deletePet,
  permanentlyDeletePet,
  restorePet,
  getPetStatistics,
};
