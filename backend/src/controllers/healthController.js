import healthService from "../services/healthService.js";

//  Get complete health overview for a pet
const getHealthOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const overview = await healthService.getHealthOverview(petId, userId);

    res.status(200).send(overview);
  } catch (error) {
    console.error("Error fetching health overview:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch health overview";
    res.status(statusCode).send({ error: message });
  }
};

//Get health overview for all pets of the user
const getAllPetsHealthOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    const overview = await healthService.getAllPetsHealthOverview(userId);

    res.status(200).send(overview);
  } catch (error) {
    console.error("Error fetching all pets health overview:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch health overview";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  getHealthOverview,
  getAllPetsHealthOverview,
};
