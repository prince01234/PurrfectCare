import vaccinationService from "../services/vaccinationService.js";

/**
 * Create a new vaccination record for a pet
 * POST /api/pets/:petId/vaccinations
 */
const createVaccination = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const vaccination = await vaccinationService.createVaccination(
      petId,
      userId,
      req.body,
    );

    res.status(201).send({
      message: "Vaccination record created successfully",
      vaccination,
    });
  } catch (error) {
    console.error("Error creating vaccination record:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create vaccination record";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Get all vaccination records for a pet
 * GET /api/pets/:petId/vaccinations
 */
const getVaccinations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
    };

    const result = await vaccinationService.getVaccinationsByPetId(
      petId,
      userId,
      queryParams,
    );

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching vaccination records:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch vaccination records";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Get a single vaccination record by ID
 * GET /api/pets/:petId/vaccinations/:vaccinationId
 */
const getVaccinationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, vaccinationId } = req.params;

    const vaccination = await vaccinationService.getVaccinationById(
      vaccinationId,
      petId,
      userId,
    );

    res.status(200).send(vaccination);
  } catch (error) {
    console.error("Error fetching vaccination record:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch vaccination record";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Update a vaccination record
 * PUT /api/pets/:petId/vaccinations/:vaccinationId
 */
const updateVaccination = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, vaccinationId } = req.params;

    const updatedVaccination = await vaccinationService.updateVaccination(
      vaccinationId,
      petId,
      userId,
      req.body,
    );

    res.status(200).send({
      message: "Vaccination record updated successfully",
      vaccination: updatedVaccination,
    });
  } catch (error) {
    console.error("Error updating vaccination record:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update vaccination record";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Delete a vaccination record
 * DELETE /api/pets/:petId/vaccinations/:vaccinationId
 */
const deleteVaccination = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, vaccinationId } = req.params;

    await vaccinationService.deleteVaccination(vaccinationId, petId, userId);

    res.status(200).send({
      message: "Vaccination record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vaccination record:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete vaccination record";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Get vaccination reminders (upcoming and overdue)
 * GET /api/pets/:petId/vaccinations/reminders
 */
const getVaccinationReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const reminders = await vaccinationService.getVaccinationReminders(
      petId,
      userId,
    );

    res.status(200).send(reminders);
  } catch (error) {
    console.error("Error fetching vaccination reminders:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch vaccination reminders";
    res.status(statusCode).send({ error: message });
  }
};

/**
 * Get vaccination statistics for a pet
 * GET /api/pets/:petId/vaccinations/stats
 */
const getVaccinationStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const stats = await vaccinationService.getVaccinationStats(petId, userId);

    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching vaccination stats:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch vaccination statistics";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createVaccination,
  getVaccinations,
  getVaccinationById,
  updateVaccination,
  deleteVaccination,
  getVaccinationReminders,
  getVaccinationStats,
};
