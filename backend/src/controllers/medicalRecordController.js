import medicalRecordService from "../services/medicalRecordService.js";

// Create a new medical record for a pet
const createMedicalRecord = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const medicalRecord = await medicalRecordService.createMedicalRecord(
      petId,
      userId,
      req.body,
    );

    res.status(201).send({
      message: "Medical record created successfully",
      medicalRecord,
    });
  } catch (error) {
    console.error("Error creating medical record:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create medical record";
    res.status(statusCode).send({ error: message });
  }
};

// Get all medical records for a pet
const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await medicalRecordService.getMedicalRecordsByPetId(
      petId,
      userId,
      queryParams,
    );

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch medical records";
    res.status(statusCode).send({ error: message });
  }
};

// Get a single medical record by ID
const getMedicalRecordById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, recordId } = req.params;

    const medicalRecord = await medicalRecordService.getMedicalRecordById(
      recordId,
      petId,
      userId,
    );

    res.status(200).send(medicalRecord);
  } catch (error) {
    console.error("Error fetching medical record:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch medical record";
    res.status(statusCode).send({ error: message });
  }
};

// Update a medical record
const updateMedicalRecord = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, recordId } = req.params;

    const updatedRecord = await medicalRecordService.updateMedicalRecord(
      recordId,
      petId,
      userId,
      req.body,
    );

    res.status(200).send({
      message: "Medical record updated successfully",
      medicalRecord: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating medical record:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update medical record";
    res.status(statusCode).send({ error: message });
  }
};

// Delete a medical record
const deleteMedicalRecord = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, recordId } = req.params;

    await medicalRecordService.deleteMedicalRecord(recordId, petId, userId);

    res.status(200).send({
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete medical record";
    res.status(statusCode).send({ error: message });
  }
};

// Get follow-up reminders (upcoming and overdue)
const getFollowUpReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const reminders = await medicalRecordService.getFollowUpReminders(
      petId,
      userId,
    );

    res.status(200).send(reminders);
  } catch (error) {
    console.error("Error fetching follow-up reminders:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch follow-up reminders";
    res.status(statusCode).send({ error: message });
  }
};

// Get medical record statistics for a pet
const getMedicalStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const stats = await medicalRecordService.getMedicalStats(petId, userId);

    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching medical stats:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch medical statistics";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getFollowUpReminders,
  getMedicalStats,
};
