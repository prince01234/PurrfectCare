import Vaccination, {
  isValidObjectId,
  toObjectId,
} from "../models/Vaccination.js";
import Pet from "../models/Pet.js";
import reminderService from "./reminderService.js";

const ALLOWED_VACCINATION_SORT_FIELDS = new Set([
  "dateGiven",
  "nextDueDate",
  "status",
  "vaccineName",
  "createdAt",
  "updatedAt",
]);

const normalizeText = (value, maxLength = null) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (typeof maxLength === "number") {
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
};

const parseDate = (value, label) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw { statusCode: 400, message: `Invalid ${label}` };
  }
  return parsed;
};

const parseOptionalDate = (value, label) => {
  if (value === undefined || value === null || value === "") return null;
  return parseDate(value, label);
};

const normalizeVaccinationPayload = (data = {}, { isCreate = false } = {}) => {
  const normalized = {};

  if (isCreate || Object.hasOwn(data, "vaccineName")) {
    const vaccineName = normalizeText(data.vaccineName, 120);
    if (!vaccineName) {
      throw { statusCode: 400, message: "Vaccine name is required" };
    }
    normalized.vaccineName = vaccineName;
  }

  if (isCreate || Object.hasOwn(data, "dateGiven")) {
    if (
      data.dateGiven === undefined ||
      data.dateGiven === null ||
      data.dateGiven === ""
    ) {
      throw { statusCode: 400, message: "Date given is required" };
    }
    normalized.dateGiven = parseDate(data.dateGiven, "date given");
  }

  if (isCreate || Object.hasOwn(data, "nextDueDate")) {
    normalized.nextDueDate = parseOptionalDate(
      data.nextDueDate,
      "next due date",
    );
  }

  if (Object.hasOwn(data, "veterinarian")) {
    normalized.veterinarian = normalizeText(data.veterinarian, 120);
  }

  if (Object.hasOwn(data, "clinic")) {
    normalized.clinic = normalizeText(data.clinic, 120);
  }

  if (Object.hasOwn(data, "notes")) {
    normalized.notes = normalizeText(data.notes, 1000);
  }

  return normalized;
};

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

// Create a new vaccination record
const createVaccination = async (petId, userId, data) => {
  const pet = await verifyPetOwnership(petId, userId);

  const { petId: _ignoredPetId, ...input } = data || {};
  const normalizedPayload = normalizeVaccinationPayload(input, {
    isCreate: true,
  });

  if (
    normalizedPayload.nextDueDate &&
    normalizedPayload.dateGiven &&
    normalizedPayload.nextDueDate < normalizedPayload.dateGiven
  ) {
    throw {
      statusCode: 400,
      message: "Next due date cannot be earlier than date given",
    };
  }

  const vaccination = await Vaccination.create({
    ...normalizedPayload,
    petId: petId,
  });

  // Auto-create reminder for next vaccination due date
  try {
    await reminderService.upsertVaccinationReminder(vaccination, pet, userId);
  } catch (error) {
    console.error("Failed to sync vaccination reminder:", error);
    // Don't fail the vaccination creation if reminder sync fails
  }

  return vaccination;
};

// Get all vaccination records for a pet
const getVaccinationsByPetId = async (petId, userId, queryParams = {}) => {
  await verifyPetOwnership(petId, userId);

  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "dateGiven",
    sortOrder = "desc",
    includeDeleted = false,
  } = queryParams;

  if (!ALLOWED_VACCINATION_SORT_FIELDS.has(sortBy)) {
    throw {
      statusCode: 400,
      message: `Invalid sort field: ${sortBy}`,
    };
  }

  // Build filter
  const filter = { petId: toObjectId(petId) };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  if (status) {
    filter.status = status;
  }

  // Pagination
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const vaccinations = await Vaccination.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Vaccination.countDocuments(filter);

  return {
    vaccinations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get a single vaccination record by ID
const getVaccinationById = async (vaccinationId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(vaccinationId)) {
    throw { statusCode: 400, message: "Invalid vaccination ID" };
  }

  const vaccination = await Vaccination.findOne({
    _id: vaccinationId,
    petId: toObjectId(petId),
    isDeleted: false,
  });

  if (!vaccination) {
    throw { statusCode: 404, message: "Vaccination record not found" };
  }

  return vaccination;
};

// Update a vaccination record
const updateVaccination = async (vaccinationId, petId, userId, data) => {
  const pet = await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(vaccinationId)) {
    throw { statusCode: 400, message: "Invalid vaccination ID" };
  }

  const vaccination = await Vaccination.findOne({
    _id: vaccinationId,
    petId: petId,
  });

  if (!vaccination || vaccination.isDeleted) {
    throw { statusCode: 404, message: "Vaccination record not found" };
  }

  // Remove fields that shouldn't be updated
  const {
    petId: _ignoredPetId,
    isDeleted,
    deletedAt,
    status,
    ...input
  } = data || {};

  const normalizedPayload = normalizeVaccinationPayload(input);

  const effectiveDateGiven =
    normalizedPayload.dateGiven || vaccination.dateGiven;
  const effectiveNextDueDate = Object.hasOwn(normalizedPayload, "nextDueDate")
    ? normalizedPayload.nextDueDate
    : vaccination.nextDueDate;

  if (
    effectiveNextDueDate &&
    effectiveDateGiven &&
    effectiveNextDueDate < effectiveDateGiven
  ) {
    throw {
      statusCode: 400,
      message: "Next due date cannot be earlier than date given",
    };
  }

  vaccination.set(normalizedPayload);
  await vaccination.save();

  try {
    await reminderService.upsertVaccinationReminder(vaccination, pet, userId);
  } catch (error) {
    console.error("Failed to sync vaccination reminder:", error);
  }

  return vaccination;
};

// Soft delete a vaccination record
const deleteVaccination = async (vaccinationId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(vaccinationId)) {
    throw { statusCode: 400, message: "Invalid vaccination ID" };
  }

  const vaccination = await Vaccination.findOne({
    _id: vaccinationId,
    petId: petId,
  });

  if (!vaccination || vaccination.isDeleted) {
    throw { statusCode: 404, message: "Vaccination record not found" };
  }

  const deletedVaccination = await Vaccination.findByIdAndUpdate(
    vaccinationId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  try {
    await reminderService.deleteReminderByRelatedRecord(
      vaccination._id,
      "Vaccination",
    );
  } catch (error) {
    console.error("Failed to delete related vaccination reminders:", error);
  }

  return deletedVaccination;
};

// Get upcoming and overdue vaccinations for a pet
const getVaccinationReminders = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get upcoming vaccinations (next 30 days)
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcoming = await Vaccination.find({
    petId: toObjectId(petId),
    isDeleted: false,
    nextDueDate: {
      $gte: today,
      $lte: thirtyDaysFromNow,
    },
  })
    .select("vaccineName nextDueDate")
    .sort({ nextDueDate: 1 })
    .lean();

  // Get overdue vaccinations
  const overdue = await Vaccination.find({
    petId: toObjectId(petId),
    isDeleted: false,
    nextDueDate: { $lt: today },
  })
    .select("vaccineName nextDueDate")
    .sort({ nextDueDate: 1 })
    .lean();

  return { upcoming, overdue };
};

// Get vaccination statistics for a pet
const getVaccinationStats = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const petObjectId = toObjectId(petId);

  const total = await Vaccination.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  const statusCounts = await Vaccination.aggregate([
    { $match: { petId: petObjectId, isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    total,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

export default {
  createVaccination,
  getVaccinationsByPetId,
  getVaccinationById,
  updateVaccination,
  deleteVaccination,
  getVaccinationReminders,
  getVaccinationStats,
};
