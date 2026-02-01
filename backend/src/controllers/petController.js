import petService from "../services/petService.js";

const createPet = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const pet = await petService.createPet(userId, req.body);

    res.status(201).send(pet);
  } catch (error) {
    console.error("Error creating pet:", error);
    res.status(400).send({ error: "Failed to create pet" });
  }
};

const getPets = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const pets = await petService.getPetsByUserId(userId);

    res.status(200).send(pets);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(400).send({ error: "Failed to fetch pets" });
  }
};

const getPetById = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
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
    const userId = req.user.id; // From auth middleware
    const petId = req.params.id;
    const updatedPet = await petService.updatePet(petId, userId, req.body);

    res.status(200).send(updatedPet);
  } catch (error) {
    console.error("Error updating pet:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update pet";
    res.status(statusCode).send({ error: message });
  }
};

const deletePet = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const petId = req.params.id;
    const deletedPet = await petService.deletePet(petId, userId);

    res.status(200).json({
      message: `Pet ${deletedPet.name} with id: ${deletedPet._id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting pet:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete pet";
    res.status(statusCode).send({ error: message });
  }
};

export default { createPet, getPets, getPetById, updatePet, deletePet };
