import reminderService from "../services/reminderService.js";

// Create a new reminder for a pet
const createReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const reminder = await reminderService.createReminder(
      petId,
      userId,
      req.body,
    );

    res.status(201).send({
      message: "Reminder created successfully",
      reminder,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Get all reminders for a pet
const getRemindersByPet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId } = req.params;

    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      reminderType: req.query.reminderType,
      status: req.query.status,
      priority: req.query.priority,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
      includeCompleted: req.query.includeCompleted === "true",
    };

    const result = await reminderService.getRemindersByPetId(
      petId,
      userId,
      queryParams,
    );

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch reminders";
    res.status(statusCode).send({ error: message });
  }
};

// Get all reminders for the logged-in user (across all pets)
const getRemindersByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      reminderType: req.query.reminderType,
      status: req.query.status,
      priority: req.query.priority,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      includeDeleted: req.query.includeDeleted === "true",
      includeCompleted: req.query.includeCompleted === "true",
      dueToday: req.query.dueToday === "true",
      upcoming: req.query.upcoming === "true",
      overdue: req.query.overdue === "true",
    };

    const result = await reminderService.getRemindersByUserId(
      userId,
      queryParams,
    );

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching user reminders:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch reminders";
    res.status(statusCode).send({ error: message });
  }
};

// Get a single reminder by ID
const getReminderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;

    const reminder = await reminderService.getReminderById(
      reminderId,
      petId,
      userId,
    );

    res.status(200).send(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Update a reminder
const updateReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;

    const updatedReminder = await reminderService.updateReminder(
      reminderId,
      petId,
      userId,
      req.body,
    );

    res.status(200).send({
      message: "Reminder updated successfully",
      reminder: updatedReminder,
    });
  } catch (error) {
    console.error("Error updating reminder:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Delete a reminder
const deleteReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;

    await reminderService.deleteReminder(reminderId, petId, userId);

    res.status(200).send({
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Complete a reminder
const completeReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;

    const completedReminder = await reminderService.completeReminder(
      reminderId,
      petId,
      userId,
    );

    res.status(200).send({
      message: "Reminder marked as completed",
      reminder: completedReminder,
    });
  } catch (error) {
    console.error("Error completing reminder:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to complete reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Snooze a reminder
const snoozeReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;
    const { minutes = 60 } = req.body;

    const snoozedReminder = await reminderService.snoozeReminder(
      reminderId,
      petId,
      userId,
      minutes,
    );

    res.status(200).send({
      message: `Reminder snoozed for ${minutes} minutes`,
      reminder: snoozedReminder,
    });
  } catch (error) {
    console.error("Error snoozing reminder:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to snooze reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Dismiss a reminder
const dismissReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, reminderId } = req.params;

    const dismissedReminder = await reminderService.dismissReminder(
      reminderId,
      petId,
      userId,
    );

    res.status(200).send({
      message: "Reminder dismissed",
      reminder: dismissedReminder,
    });
  } catch (error) {
    console.error("Error dismissing reminder:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to dismiss reminder";
    res.status(statusCode).send({ error: message });
  }
};

// Get reminder statistics for the logged-in user
const getReminderStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await reminderService.getReminderStats(userId);

    res.status(200).send(stats);
  } catch (error) {
    console.error("Error fetching reminder statistics:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch reminder statistics";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createReminder,
  getRemindersByPet,
  getRemindersByUser,
  getReminderById,
  updateReminder,
  deleteReminder,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  getReminderStats,
};
