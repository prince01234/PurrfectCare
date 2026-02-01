import Pet from "../models/Pet.js";

const createPet = async (userId, data) => {
  const petData = {
    ...data,
    userId: userId,
  };

  const pet = await Pet.create(petData);
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

  // Build filter query
  const filter = { userId };

  // Exclude soft-deleted pets by default
  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  // Add search filters
  if (species) {
    filter.species = species;
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" }; // Case-insensitive search
  }

  if (breed) {
    filter.breed = { $regex: breed, $options: "i" };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query with pagination
  const pets = await Pet.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination metadata
  const total = await Pet.countDocuments(filter);

  return {
    pets,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPetById = async (petId, userId) => {
  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw {
      statusCode: 404,
      message: "Pet not found",
    };
  }

  // Check if the pet belongs to the user
  if (pet.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You do not have permission to access this pet",
    };
  }

  return pet;
};

const updatePet = async (petId, userId, body) => {
  // First verify the pet exists and belongs to the user
  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw {
      statusCode: 404,
      message: "Pet not found",
    };
  }

  // Check if the pet belongs to the user
  if (pet.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You do not have permission to update this pet",
    };
  }

  // Prevent updating userId and soft delete fields directly
  delete body.userId;
  delete body.isDeleted;
  delete body.deletedAt;

  // Update the pet
  const updatedPet = await Pet.findByIdAndUpdate(petId, body, { new: true });

  return updatedPet;
};

const deletePet = async (petId, userId) => {
  // First verify the pet exists and belongs to the user
  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw {
      statusCode: 404,
      message: "Pet not found",
    };
  }

  // Check if the pet belongs to the user
  if (pet.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You do not have permission to delete this pet",
    };
  }

  // Soft delete the pet
  const deletedPet = await Pet.findByIdAndUpdate(
    petId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true },
  );

  return deletedPet;
};

const restorePet = async (petId, userId) => {
  // Find the soft-deleted pet
  const pet = await Pet.findById(petId);

  if (!pet) {
    throw {
      statusCode: 404,
      message: "Pet not found",
    };
  }

  if (!pet.isDeleted) {
    throw {
      statusCode: 400,
      message: "Pet is not deleted",
    };
  }

  // Check if the pet belongs to the user
  if (pet.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You do not have permission to restore this pet",
    };
  }

  // Restore the pet
  const restoredPet = await Pet.findByIdAndUpdate(
    petId,
    {
      isDeleted: false,
      deletedAt: null,
    },
    { new: true },
  );

  return restoredPet;
};

const getPetStatistics = async (userId) => {
  // Get all active (non-deleted) pets for the user
  const pets = await Pet.find({ userId, isDeleted: false });

  // Count by species
  const countBySpecies = await Pet.aggregate([
    { $match: { userId, isDeleted: false } },
    { $group: { _id: "$species", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Calculate average age
  const petsWithAge = pets.filter((pet) => pet.dateOfBirth || pet.age);
  const totalAge = petsWithAge.reduce((sum, pet) => {
    if (pet.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(pet.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return sum + age;
    }
    return sum + (pet.age || 0);
  }, 0);

  const averageAge = petsWithAge.length > 0 ? totalAge / petsWithAge.length : 0;

  // Count by gender
  const countByGender = await Pet.aggregate([
    { $match: { userId, isDeleted: false } },
    { $group: { _id: "$gender", count: { $sum: 1 } } },
  ]);

  return {
    totalPets: pets.length,
    averageAge: Math.round(averageAge * 10) / 10, // Round to 1 decimal
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
