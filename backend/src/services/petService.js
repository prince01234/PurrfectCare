import Pet from "../models/Pet.js";

const createPet = async (userId, data) => {
  const petData = {
    ...data,
    userId: userId,
  };

  const pet = await Pet.create(petData);
  return pet;
};

const getPetsByUserId = async (userId) => {
  const pets = await Pet.find({ userId });
  return pets;
};

const getPetById = async (petId, userId) => {
  const pet = await Pet.findById(petId);

  if (!pet) {
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

  if (!pet) {
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

  // Update the pet
  const updatedPet = await Pet.findByIdAndUpdate(petId, body, { new: true });

  return updatedPet;
};

const deletePet = async (petId, userId) => {
  // First verify the pet exists and belongs to the user
  const pet = await Pet.findById(petId);

  if (!pet) {
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

  // Delete the pet
  const deletedPet = await Pet.findByIdAndDelete(petId);

  return deletedPet;
};

export default {
  createPet,
  getPetsByUserId,
  getPetById,
  updatePet,
  deletePet,
};
