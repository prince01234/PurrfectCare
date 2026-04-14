import Reminder, { isValidObjectId, toObjectId } from "../models/Reminder.js";
import Pet from "../models/Pet.js";
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

const parseDueTime = (dueTime) => {
  const fallback = { hours: 9, minutes: 0 };

  if (typeof dueTime !== "string" || !dueTime.includes(":")) {
    return fallback;
  }

  const [hourRaw, minuteRaw] = dueTime.split(":");
  const hours = Number.parseInt(hourRaw, 10);
  const minutes = Number.parseInt(minuteRaw, 10);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback;
  }

  return { hours, minutes };
};

const getReminderDueDateTime = (reminder) => {
  if (!reminder?.dueDate) return null;

  const dueDate = new Date(reminder.dueDate);
  if (Number.isNaN(dueDate.getTime())) return null;

  const { hours, minutes } = parseDueTime(reminder.dueTime);
  dueDate.setHours(hours, minutes, 0, 0);

  return dueDate;
};

const hasReminderBeenSentInCurrentCycle = (
  sentAt,
  frequency = REMINDER_FREQUENCY.ONCE,
  now = new Date(),
) => {
  if (!sentAt) return false;

  const sentDate = new Date(sentAt);
  if (Number.isNaN(sentDate.getTime())) return false;

  switch (frequency) {
    case REMINDER_FREQUENCY.ONCE:
      return true;

    case REMINDER_FREQUENCY.DAILY: {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return sentDate >= startOfDay;
    }

    case REMINDER_FREQUENCY.WEEKLY: {
      const startOfWeek = new Date(now);
      const day = (startOfWeek.getDay() + 6) % 7; // Monday-based week
      startOfWeek.setDate(startOfWeek.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      return sentDate >= startOfWeek;
    }

    case REMINDER_FREQUENCY.MONTHLY:
      return (
        sentDate.getFullYear() === now.getFullYear() &&
        sentDate.getMonth() === now.getMonth()
      );

    case REMINDER_FREQUENCY.YEARLY:
      return sentDate.getFullYear() === now.getFullYear();

    default:
      return false;
  }
};

const isReminderDueForDispatch = (reminder, sentAt, now = new Date()) => {
  if (
    !reminder ||
    reminder.status !== REMINDER_STATUS.ACTIVE ||
    reminder.isDeleted
  ) {
    return false;
  }

  const dueDateTime = getReminderDueDateTime(reminder);
  if (!dueDateTime) return false;
  if (dueDateTime > now) return false;

  return !hasReminderBeenSentInCurrentCycle(sentAt, reminder.frequency, now);
};

// Create a new reminder
const createReminder = async (petId, userId, data) => {
  await verifyPetOwnership(petId, userId);

  // Remove petId and userId from body if provided (we use the URL param)
  delete data.petId;
  delete data.userId;

  // Apply default settings based on reminder type
  const defaults = REMINDER_DEFAULTS[data.reminderType] || {};
  const effectivePriority = (
    data.priority ||
    defaults.priority ||
    ""
  ).toLowerCase();
  const shouldSendEmail =
    data.sendEmail !== undefined
      ? Boolean(data.sendEmail)
      : EMAIL_NOTIFICATION_TYPES.includes(data.reminderType) ||
        effectivePriority === "critical";

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

  const effectiveReminderType =
    updateData.reminderType || reminder.reminderType;
  const effectivePriority = (
    updateData.priority ||
    reminder.priority ||
    ""
  ).toLowerCase();

  if (updateData.sendEmail === undefined) {
    const reminderTypeChanged =
      updateData.reminderType !== undefined &&
      updateData.reminderType !== reminder.reminderType;
    const priorityChanged =
      updateData.priority !== undefined &&
      updateData.priority !== reminder.priority;

    if (reminderTypeChanged || priorityChanged) {
      updateData.sendEmail =
        EMAIL_NOTIFICATION_TYPES.includes(effectiveReminderType) ||
        effectivePriority === "critical";
    }
  }

  if (
    updateData.dueDate !== undefined ||
    updateData.dueTime !== undefined ||
    updateData.frequency !== undefined
  ) {
    updateData.lastNotificationSent = null;
    updateData.emailSentAt = null;
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

  const reminders = await Reminder.find({
    $or: [{ sendEmail: true }, { priority: "critical" }],
    status: REMINDER_STATUS.ACTIVE,
    isDeleted: false,
    dueDate: { $lte: now },
  })
    .populate("petId", "name species")
    .populate("userId", "name email");

  return reminders.filter((reminder) =>
    isReminderDueForDispatch(reminder, reminder.emailSentAt, now),
  );
};

// Get reminders that need in-app/push notifications (for scheduler)
const getRemindersForInAppNotification = async () => {
  const now = new Date();

  const reminders = await Reminder.find({
    status: REMINDER_STATUS.ACTIVE,
    isDeleted: false,
    dueDate: { $lte: now },
  })
    .populate("petId", "name species")
    .populate("userId", "name email");

  return reminders.filter((reminder) =>
    isReminderDueForDispatch(reminder, reminder.lastNotificationSent, now),
  );
};

// Mark reminder as email sent
const markEmailSent = async (reminderId) => {
  await Reminder.findByIdAndUpdate(reminderId, {
    emailSentAt: new Date(),
  });
};

// Mark reminder as in-app/push notification sent
const markReminderNotificationSent = async (reminderId) => {
  await Reminder.findByIdAndUpdate(reminderId, {
    lastNotificationSent: new Date(),
  });
};

const upsertReminderByRelatedRecord = async (
  relatedRecordId,
  relatedRecordType,
  payload,
) => {
  const existingReminder = await Reminder.findOne({
    relatedRecordId,
    relatedRecordType,
  });

  if (!existingReminder) {
    return Reminder.create({
      ...payload,
      relatedRecordId,
      relatedRecordType,
    });
  }

  existingReminder.set({
    ...payload,
    relatedRecordId,
    relatedRecordType,
    isDeleted: false,
    deletedAt: null,
    status: REMINDER_STATUS.ACTIVE,
    completedAt: null,
    dismissedAt: null,
    snoozedUntil: null,
  });

  return existingReminder.save();
};

const deleteReminderByRelatedRecord = async (
  relatedRecordId,
  relatedRecordType,
) => {
  if (!relatedRecordId || !relatedRecordType) return;

  await Reminder.updateMany(
    {
      relatedRecordId,
      relatedRecordType,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: REMINDER_STATUS.DISMISSED,
        dismissedAt: new Date(),
      },
    },
  );
};

const upsertVaccinationReminder = async (vaccination, pet, userId) => {
  if (!vaccination?._id || !pet?._id || !userId) return null;

  if (!vaccination.nextDueDate) {
    await deleteReminderByRelatedRecord(vaccination._id, "Vaccination");
    return null;
  }

  return upsertReminderByRelatedRecord(vaccination._id, "Vaccination", {
    userId,
    petId: pet._id,
    title: `Vaccination Due: ${vaccination.vaccineName}`,
    description: `${pet.name}'s ${vaccination.vaccineName} vaccination is due`,
    reminderType: "vaccination_due",
    dueDate: vaccination.nextDueDate,
    priority: "critical",
    sendEmail: true,
    status: REMINDER_STATUS.ACTIVE,
    details: {
      vaccineName: vaccination.vaccineName,
      vetName: vaccination.veterinarian,
      clinic: vaccination.clinic,
    },
  });
};

const upsertMedicalFollowUpReminder = async (medicalRecord, pet, userId) => {
  if (!medicalRecord?._id || !pet?._id || !userId) return null;

  if (!medicalRecord.followUpDate) {
    await deleteReminderByRelatedRecord(medicalRecord._id, "MedicalRecord");
    return null;
  }

  return upsertReminderByRelatedRecord(medicalRecord._id, "MedicalRecord", {
    userId,
    petId: pet._id,
    title: `Vet Follow-up: ${medicalRecord.reasonForVisit}`,
    description: `${pet.name} has a follow-up appointment scheduled`,
    reminderType: "vet_checkup",
    dueDate: medicalRecord.followUpDate,
    priority: "medium",
    sendEmail: false,
    status: REMINDER_STATUS.ACTIVE,
    details: {
      vetName: medicalRecord.vetName,
      clinic: medicalRecord.clinic,
    },
  });
};

// Auto-generate reminder from vaccination record
const createVaccinationReminder = async (vaccination, pet, userId) => {
  return upsertVaccinationReminder(vaccination, pet, userId);
};

// Auto-generate reminder from medical record follow-up
const createMedicalFollowUpReminder = async (medicalRecord, pet, userId) => {
  return upsertMedicalFollowUpReminder(medicalRecord, pet, userId);
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
  getRemindersForInAppNotification,
  markEmailSent,
  markReminderNotificationSent,
  upsertVaccinationReminder,
  upsertMedicalFollowUpReminder,
  deleteReminderByRelatedRecord,
  createVaccinationReminder,
  createMedicalFollowUpReminder,
};
