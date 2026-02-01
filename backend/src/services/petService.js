import Pet, { isValidObjectId, toObjectId } from "../models/Pet.js";

const createPet = async (userId, data) => {
  // Remove userId from body if user tries to set it (security)
  delete data.userId;

  // Create pet with authenticated userId
  const pet = await Pet.create({
    ...data,
    userId: userId,
  });

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

const updatePet = async (petId, userId, body) => {
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
  const { userId: _, isDeleted, deletedAt, ...updateData } = body;

  const updatedPet = await Pet.findByIdAndUpdate(petId, updateData, {
    new: true,
    runValidators: true,
  });

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

  // Soft delete
  const deletedPet = await Pet.findByIdAndUpdate(
    petId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  return deletedPet;
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
  deletePet,
  restorePet,
  getPetStatistics,
};
