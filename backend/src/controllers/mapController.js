import mapService from "../services/mapService.js";

// Get service provider locations for map
const getProviderLocations = async (req, res) => {
  try {
    const providers = await mapService.getProviderLocations(req.query);
    res.status(200).send({ providers });
  } catch (error) {
    console.error("Error fetching provider locations:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch provider locations";
    res.status(statusCode).send({ error: message });
  }
};

// Get adoption listing locations for map
const getAdoptionLocations = async (req, res) => {
  try {
    const listings = await mapService.getAdoptionLocations();
    res.status(200).send({ listings });
  } catch (error) {
    console.error("Error fetching adoption locations:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch adoption locations";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  getProviderLocations,
  getAdoptionLocations,
};
