import Reminder, { isValidObjectId, toObjectId } from "../models/Reminder.js";
import Pet from "../models/Pet.js";
import User from "../models/User.js";
import {
  REMINDER_STATUS,
  REMINDER_FREQUENCY,
  REMINDER_DEFAULTS,
  EMAIL_NOTIFICATION_TYPES,
} from "../constants/reminder.js";

// Verify pet ownership before any operation
const verifyPetOwnership = async (petId, userId) => {
  if (!isValidObjectId(petId)) {
    throw { statusCode: 400, message: "Invalid pet ID" };
  }

  const pet = await Pet.findById(petId);

  if (!pet || pet.isDeleted) {
    throw { statusCode: 404, message: "Pet not found" };
  }

  if (pet.userId.toString() !== userId.toString()) {
    throw {
      statusCode: 403,
      message: "Access denied. You don't own this pet.",
    };
  }

  return pet;
};

// Create a new reminder
const createReminder = async (petId, userId, data) => {
  await verifyPetOwnership(petId, userId);

  // Remove petId and userId from body if provided (we use the URL param)
  delete data.petId;
  delete data.userId;

  // Apply default settings based on reminder type
  const defaults = REMINDER_DEFAULTS[data.reminderType] || {};
  const shouldSendEmail =
    data.sendEmail !== undefined
      ? data.sendEmail
      : EMAIL_NOTIFICATION_TYPES.includes(data.reminderType);

  // Set isRecurring based on frequency
  const isRecurring =
    data.frequency && data.frequency !== REMINDER_FREQUENCY.ONCE;

  const reminder = await Reminder.create({
    ...defaults,
    ...data,
    petId: petId,
    userId: userId,
    sendEmail: shouldSendEmail,
    isRecurring: isRecurring,
  });

  return reminder;
};

// Get all reminders for a pet
const getRemindersByPetId = async (petId, userId, queryParams = {}) => {
  await verifyPetOwnership(petId, userId);

  const {
    page = 1,
    limit = 10,
    reminderType,
    status,
    priority,
    sortBy = "dueDate",
    sortOrder = "asc",
    includeDeleted = false,
    includeCompleted = false,
  } = queryParams;

  // Build filter
  const filter = { petId: toObjectId(petId) };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  if (!includeCompleted) {
    filter.status = { $ne: REMINDER_STATUS.COMPLETED };
  }

  if (reminderType) {
    filter.reminderType = reminderType;
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const reminders = await Reminder.find(filter)
    .populate("petId", "name species photos")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Reminder.countDocuments(filter);

  return {
    reminders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get all reminders for a user (across all pets)
const getRemindersByUserId = async (userId, queryParams = {}) => {
  const {
    page = 1,
    limit = 20,
    reminderType,
    status,
    priority,
    sortBy = "dueDate",
    sortOrder = "asc",
    includeDeleted = false,
    includeCompleted = false,
    dueToday = false,
    upcoming = false,
    overdue = false,
  } = queryParams;

  // Build filter
  const filter = { userId: toObjectId(userId) };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  if (!includeCompleted) {
    filter.status = { $ne: REMINDER_STATUS.COMPLETED };
  }

  if (reminderType) {
    filter.reminderType = reminderType;
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  // Date filters
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dueToday) {
    filter.dueDate = { $gte: today, $lt: tomorrow };
  }

  if (upcoming) {
    filter.dueDate = { $gte: today };
  }

  if (overdue) {
    filter.dueDate = { $lt: today };
    filter.status = REMINDER_STATUS.ACTIVE;
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const reminders = await Reminder.find(filter)
    .populate("petId", "name species photos")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Reminder.countDocuments(filter);

  return {
    reminders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get a single reminder by ID
const getReminderById = async (reminderId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  }).populate("petId", "name species photos");

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  return reminder;
};

// Update a reminder
const updateReminder = async (reminderId, petId, userId, data) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  });

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  // Remove fields that shouldn't be updated directly
  const {
    userId: _,
    petId: __,
    isDeleted,
    deletedAt,
    emailSentAt,
    ...updateData
  } = data;

  // Update isRecurring based on frequency
  if (updateData.frequency) {
    updateData.isRecurring = updateData.frequency !== REMINDER_FREQUENCY.ONCE;
  }

  const updatedReminder = await Reminder.findByIdAndUpdate(
    reminderId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).populate("petId", "name species photos");

  return updatedReminder;
};

// Delete a reminder (soft delete)
const deleteReminder = async (reminderId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  });

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  await Reminder.findByIdAndUpdate(reminderId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: "Reminder deleted successfully" };
};

// Complete a reminder
const completeReminder = async (reminderId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  });

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  // If it's a recurring reminder, create the next occurrence
  if (reminder.isRecurring && reminder.frequency !== REMINDER_FREQUENCY.ONCE) {
    await createNextRecurringReminder(reminder);
  }

  const updatedReminder = await Reminder.findByIdAndUpdate(
    reminderId,
    {
      status: REMINDER_STATUS.COMPLETED,
      completedAt: new Date(),
    },
    { new: true },
  ).populate("petId", "name species photos");

  return updatedReminder;
};

// Snooze a reminder
const snoozeReminder = async (
  reminderId,
  petId,
  userId,
  snoozeMinutes = 60,
) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  });

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  const snoozedUntil = new Date();
  snoozedUntil.setMinutes(snoozedUntil.getMinutes() + snoozeMinutes);

  const updatedReminder = await Reminder.findByIdAndUpdate(
    reminderId,
    {
      status: REMINDER_STATUS.SNOOZED,
      snoozedUntil: snoozedUntil,
    },
    { new: true },
  ).populate("petId", "name species photos");

  return updatedReminder;
};

// Dismiss a reminder
const dismissReminder = async (reminderId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(reminderId)) {
    throw { statusCode: 400, message: "Invalid reminder ID" };
  }

  const reminder = await Reminder.findOne({
    _id: reminderId,
    petId: petId,
    isDeleted: false,
  });

  if (!reminder) {
    throw { statusCode: 404, message: "Reminder not found" };
  }

  const updatedReminder = await Reminder.findByIdAndUpdate(
    reminderId,
    {
      status: REMINDER_STATUS.DISMISSED,
      dismissedAt: new Date(),
    },
    { new: true },
  ).populate("petId", "name species photos");

  return updatedReminder;
};

// Create next recurring reminder
const createNextRecurringReminder = async (originalReminder) => {
  const nextDueDate = new Date(originalReminder.dueDate);

  switch (originalReminder.frequency) {
    case REMINDER_FREQUENCY.DAILY:
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case REMINDER_FREQUENCY.WEEKLY:
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case REMINDER_FREQUENCY.MONTHLY:
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case REMINDER_FREQUENCY.YEARLY:
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
    default:
      return null;
  }

  // Check if next due date exceeds recurring end date
  if (
    originalReminder.recurringEndDate &&
    nextDueDate > originalReminder.recurringEndDate
  ) {
    return null;
  }

  const newReminder = await Reminder.create({
    userId: originalReminder.userId,
    petId: originalReminder.petId,
    title: originalReminder.title,
    description: originalReminder.description,
    reminderType: originalReminder.reminderType,
    dueDate: nextDueDate,
    dueTime: originalReminder.dueTime,
    frequency: originalReminder.frequency,
    isRecurring: originalReminder.isRecurring,
    recurringEndDate: originalReminder.recurringEndDate,
    priority: originalReminder.priority,
    sendEmail: originalReminder.sendEmail,
    details: originalReminder.details,
  });

  return newReminder;
};

// Get reminder statistics for a user
const getReminderStats = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const baseFilter = {
    userId: toObjectId(userId),
    isDeleted: false,
  };

  const [totalActive, dueToday, overdue, upcomingWeek, completed, byType] =
    await Promise.all([
      // Total active reminders
      Reminder.countDocuments({
        ...baseFilter,
        status: REMINDER_STATUS.ACTIVE,
      }),

      // Due today
      Reminder.countDocuments({
        ...baseFilter,
        status: REMINDER_STATUS.ACTIVE,
        dueDate: { $gte: today, $lt: tomorrow },
      }),

      // Overdue
      Reminder.countDocuments({
        ...baseFilter,
        status: REMINDER_STATUS.ACTIVE,
        dueDate: { $lt: today },
      }),

      // Upcoming this week
      Reminder.countDocuments({
        ...baseFilter,
        status: REMINDER_STATUS.ACTIVE,
        dueDate: { $gte: today, $lt: nextWeek },
      }),

      // Completed
      Reminder.countDocuments({
        ...baseFilter,
        status: REMINDER_STATUS.COMPLETED,
      }),

      // By type
      Reminder.aggregate([
        { $match: { ...baseFilter, status: REMINDER_STATUS.ACTIVE } },
        { $group: { _id: "$reminderType", count: { $sum: 1 } } },
      ]),
    ]);

  return {
    totalActive,
    dueToday,
    overdue,
    upcomingWeek,
    completed,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

// Get reminders that need email notifications (for scheduler)
const getRemindersForEmailNotification = async () => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find reminders that:
  // 1. Should send email
  // 2. Are active
  // 3. Due today or overdue
  // 4. Haven't sent email today
  const reminders = await Reminder.find({
    sendEmail: true,
    status: REMINDER_STATUS.ACTIVE,
    isDeleted: false,
    dueDate: { $lte: tomorrow },
    $or: [
      { lastNotificationSent: null },
      { lastNotificationSent: { $lt: today } },
    ],
  })
    .populate("petId", "name species")
    .populate("userId", "name email");

  return reminders;
};

// Mark reminder as email sent
const markEmailSent = async (reminderId) => {
  await Reminder.findByIdAndUpdate(reminderId, {
    lastNotificationSent: new Date(),
    emailSentAt: new Date(),
  });
};

// Auto-generate reminder from vaccination record
const createVaccinationReminder = async (vaccination, pet, userId) => {
  if (!vaccination.nextDueDate) return null;

  const reminder = await Reminder.create({
    userId: userId,
    petId: pet._id,
    title: `Vaccination Due: ${vaccination.vaccineName}`,
    description: `${pet.name}'s ${vaccination.vaccineName} vaccination is due`,
    reminderType: "vaccination_due",
    dueDate: vaccination.nextDueDate,
    priority: "critical",
    sendEmail: true,
    relatedRecordId: vaccination._id,
    relatedRecordType: "Vaccination",
    details: {
      vaccineName: vaccination.vaccineName,
      vetName: vaccination.veterinarian,
      clinic: vaccination.clinic,
    },
  });

  return reminder;
};

// Auto-generate reminder from medical record follow-up
const createMedicalFollowUpReminder = async (medicalRecord, pet, userId) => {
  if (!medicalRecord.followUpDate) return null;

  const reminder = await Reminder.create({
    userId: userId,
    petId: pet._id,
    title: `Vet Follow-up: ${medicalRecord.reasonForVisit}`,
    description: `${pet.name} has a follow-up appointment scheduled`,
    reminderType: "vet_checkup",
    dueDate: medicalRecord.followUpDate,
    priority: "medium",
    sendEmail: false,
    relatedRecordId: medicalRecord._id,
    relatedRecordType: "MedicalRecord",
    details: {
      vetName: medicalRecord.vetName,
      clinic: medicalRecord.clinic,
    },
  });

  return reminder;
};

export default {
  createReminder,
  getRemindersByPetId,
  getRemindersByUserId,
  getReminderById,
  updateReminder,
  deleteReminder,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  getReminderStats,
  getRemindersForEmailNotification,
  markEmailSent,
  createVaccinationReminder,
  createMedicalFollowUpReminder,
};
