import careLogService from "../services/careLogService.js";

//Create a new care log entry for a pet
const createCareLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const careLog = await careLogService.createCareLog(petId, userId, req.body);

    res.status(201).send({
      message: "Care log created successfully",
      careLog,
    });
  } catch (error) {
    console.error("Error creating care log:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create care log";
    res.status(statusCode).send({ error: message });
  }
};

//Get all care logs for a pet
const getCareLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      careType: req.query.careType,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await careLogService.getCareLogsByPetId(
      petId,
      userId,
      queryParams,
    );

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching care logs:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch care logs";
    res.status(statusCode).send({ error: message });
  }
};

//Get a single care log by ID
const getCareLogById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, logId } = req.params;

    const careLog = await careLogService.getCareLogById(logId, petId, userId);

    res.status(200).send(careLog);
  } catch (error) {
    console.error("Error fetching care log:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch care log";
    res.status(statusCode).send({ error: message });
  }
};

//Update a care log entry
const updateCareLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, logId } = req.params;

    const updatedLog = await careLogService.updateCareLog(
      logId,
      petId,
      userId,
      req.body,
    );

    res.status(200).send({
      message: "Care log updated successfully",
      careLog: updatedLog,
    });
  } catch (error) {
    console.error("Error updating care log:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update care log";
    res.status(statusCode).send({ error: message });
  }
};

//Delete a care log entry
const deleteCareLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, logId } = req.params;

    await careLogService.deleteCareLog(logId, petId, userId);

    res.status(200).send({
      message: "Care log deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting care log:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete care log";
    res.status(statusCode).send({ error: message });
  }
};

//Get care log statistics for a pet
const getCareLogStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const stats = await careLogService.getCareLogStats(petId, userId);

    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching care log stats:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch care log statistics";
    res.status(statusCode).send({ error: message });
  }
};

//Get today's care logs for a pet
const getTodayCareLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const careLogs = await careLogService.getTodayCareLogs(petId, userId);

    res.status(200).send({
      date: new Date().toISOString().split("T")[0],
      count: careLogs.length,
      careLogs,
    });
  } catch (error) {
    console.error("Error fetching today's care logs:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch today's care logs";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createCareLog,
  getCareLogs,
  getCareLogById,
  updateCareLog,
  deleteCareLog,
  getCareLogStats,
  getTodayCareLogs,
};
