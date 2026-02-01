import Pet, { isValidObjectId, toObjectId } from "../models/Pet.js";
import User from "../models/User.js";
import uploadFile from "../utils/file.js";
import { PET_OWNER, USER } from "../constants/roles.js";

const createPet = async (userId, data, files) => {
  // Remove userId from body if user tries to set it (security)
  delete data.userId;

  // Upload photos if provided
  let photoUrls = [];
  if (files && files.length > 0) {
    const uploadedFiles = await uploadFile(files);
    photoUrls = uploadedFiles.map((item) => item?.url).filter((url) => url); // Filter out null values
  }

  // Create pet with authenticated userId
  const pet = await Pet.create({
    ...data,
    userId: userId,
    photos: photoUrls,
  });

  // Update user role to PET_OWNER if they are still a normal USER
  const user = await User.findById(userId);
  if (user && user.roles === USER) {
    await User.findByIdAndUpdate(userId, { roles: PET_OWNER });
  }

  return pet;
};

const getPetsByUserId = async (userId, queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    species,
    name,
    breed,
    sortBy = "createdAt",
    sortOrder = "desc",
    includeDeleted = false,
  } = queryParams;

  // Build filter - always filter by authenticated userId
  const filter = { userId };

  // Exclude soft-deleted pets unless includeDeleted is true
  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  // Add optional filters
  if (species) filter.species = species.toLowerCase();
  if (name) filter.name = { $regex: name, $options: "i" };
  if (breed) filter.breed = { $regex: breed, $options: "i" };

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Query
  const pets = await Pet.find(filter).sort(sort).skip(skip).limit(limitNum);
  const total = await Pet.countDocuments(filter);

  return {
    pets,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getPetById = async (petId, userId) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  // Only return if pet belongs to authenticated user
  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  return pet;
};

const updatePet = async (petId, userId, body, files) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  // Only allow update if pet belongs to authenticated user
  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Remove fields that shouldn't be updated
  const {
    userId: _,
    isDeleted,
    deletedAt,
    photos: existingPhotos,
    ...updateData
  } = body;

  // Handle new photo uploads
  if (files && files.length > 0) {
    const uploadedFiles = await uploadFile(files, pet.photos || []);
    const newPhotoUrls = uploadedFiles
      .map((item) => item?.url)
      .filter((url) => url); // Filter out null values

    // Replace photos or append to existing ones
    if (body.replacePhotos === "true" || body.replacePhotos === true) {
      updateData.photos = newPhotoUrls;
    } else {
      // Append new photos to existing ones
      updateData.photos = [...(pet.photos || []), ...newPhotoUrls];
    }
  }

  const updatedPet = await Pet.findByIdAndUpdate(petId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedPet;
};

const addPetPhotos = async (petId, userId, files) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  if (!files || files.length === 0) {
    throw { statusCode: 400, message: "No files provided" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Check if adding new photos would exceed limit
  const currentPhotoCount = pet.photos?.length || 0;
  if (currentPhotoCount + files.length > 10) {
    throw {
      statusCode: 400,
      message: `Cannot add ${files.length} photos. Maximum 10 photos allowed. Current: ${currentPhotoCount}`,
    };
  }

  // Upload new photos
  const uploadedFiles = await uploadFile(files, pet.photos || []);
  const newPhotoUrls = uploadedFiles
    .map((item) => item?.url)
    .filter((url) => url); // Filter out null values

  // Check if we have any new photos after duplicate filtering
  if (newPhotoUrls.length === 0) {
    throw {
      statusCode: 400,
      message: "All uploaded photos are duplicates of existing photos",
    };
  }

  // Update pet with new photos
  const updatedPet = await Pet.findByIdAndUpdate(
    petId,
    { $push: { photos: { $each: newPhotoUrls } } },
    { new: true },
  );

  return updatedPet;
};

const deletePetPhoto = async (petId, userId, photoUrl) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  if (!photoUrl) {
    throw { statusCode: 400, message: "Photo URL is required" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Check if photo exists in pet's photos
  if (!pet.photos || !pet.photos.includes(photoUrl)) {
    throw { statusCode: 404, message: "Photo not found" };
  }

  // Remove photo URL from pet
  const updatedPet = await Pet.findByIdAndUpdate(
    petId,
    { $pull: { photos: photoUrl } },
    { new: true },
  );

  return updatedPet;
};

const deletePet = async (petId, userId) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  // Only allow delete if pet belongs to authenticated user
  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Soft delete (photos are kept for potential restore)
  const deletedPet = await Pet.findByIdAndUpdate(
    petId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  return deletedPet;
};

const permanentlyDeletePet = async (petId, userId) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Permanently delete pet
  await Pet.findByIdAndDelete(petId);

  return pet;
};

const restorePet = async (petId, userId) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  if (!pet.isDeleted) {
    throw { statusCode: 400, message: "Pet is not deleted" };
  }

  // Only allow restore if pet belongs to authenticated user
  if (pet.userId.toString() !== userId) {
    throw { statusCode: 403, message: "Access denied" };
  }

  const restoredPet = await Pet.findByIdAndUpdate(
    petId,
    { isDeleted: false, deletedAt: null },
    { new: true },
  );

  return restoredPet;
};

const getPetStatistics = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw { statusCode: 400, message: "Invalid user ID" };
  }

  const userObjectId = toObjectId(userId);

  const totalPets = await Pet.countDocuments({
    userId: userObjectId,
    isDeleted: false,
  });

  const countBySpecies = await Pet.aggregate([
    { $match: { userId: userObjectId, isDeleted: false } },
    { $group: { _id: "$species", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const countByGender = await Pet.aggregate([
    { $match: { userId: userObjectId, isDeleted: false } },
    { $group: { _id: "$gender", count: { $sum: 1 } } },
  ]);

  const avgAgeResult = await Pet.aggregate([
    { $match: { userId: userObjectId, isDeleted: false, age: { $ne: null } } },
    { $group: { _id: null, averageAge: { $avg: "$age" } } },
  ]);

  const averageAge = avgAgeResult[0]?.averageAge || 0;

  return {
    totalPets,
    averageAge: Math.round(averageAge * 10) / 10,
    countBySpecies,
    countByGender,
  };
};

export default {
  createPet,
  getPetsByUserId,
  getPetById,
  updatePet,
  addPetPhotos,
  deletePetPhoto,
  deletePet,
  permanentlyDeletePet,
  restorePet,
  getPetStatistics,
};
