import MedicalRecord, {
  isValidObjectId,
  toObjectId,
} from "../models/MedicalRecord.js";
import Pet from "../models/Pet.js";
import reminderService from "./reminderService.js";

const ALLOWED_MEDICAL_SORT_FIELDS = new Set([
  "visitDate",
  "followUpDate",
  "createdAt",
  "updatedAt",
  "reasonForVisit",
  "vetName",
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

const normalizeSymptoms = (symptoms) => {
  if (symptoms === undefined) return undefined;
  if (symptoms === null || symptoms === "") return [];

  if (!Array.isArray(symptoms)) {
    throw {
      statusCode: 400,
      message: "Symptoms must be an array of strings",
    };
  }

  return symptoms
    .map((item) => normalizeText(item, 120))
    .filter(Boolean)
    .slice(0, 20);
};

const normalizeNumber = (
  value,
  label,
  { min = Number.NEGATIVE_INFINITY } = {},
) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw { statusCode: 400, message: `${label} must be a valid number` };
  }
  if (numberValue < min) {
    throw { statusCode: 400, message: `${label} cannot be below ${min}` };
  }

  return numberValue;
};

const normalizeMedicalRecordPayload = (
  data = {},
  { isCreate = false } = {},
) => {
  const normalized = {};

  if (isCreate || Object.hasOwn(data, "visitDate")) {
    if (
      data.visitDate === undefined ||
      data.visitDate === null ||
      data.visitDate === ""
    ) {
      throw { statusCode: 400, message: "Visit date is required" };
    }
    normalized.visitDate = parseDate(data.visitDate, "visit date");
  }

  if (isCreate || Object.hasOwn(data, "reasonForVisit")) {
    const reason = normalizeText(data.reasonForVisit, 200);
    if (!reason) {
      throw { statusCode: 400, message: "Reason for visit is required" };
    }
    normalized.reasonForVisit = reason;
  }

  if (Object.hasOwn(data, "vetName")) {
    normalized.vetName = normalizeText(data.vetName, 120);
  }

  if (Object.hasOwn(data, "clinic")) {
    normalized.clinic = normalizeText(data.clinic, 120);
  }

  if (Object.hasOwn(data, "weight")) {
    normalized.weight = normalizeNumber(data.weight, "Weight", { min: 0 });
  }

  if (Object.hasOwn(data, "temperature")) {
    normalized.temperature = normalizeNumber(data.temperature, "Temperature");
  }

  const normalizedSymptoms = normalizeSymptoms(data.symptoms);
  if (normalizedSymptoms !== undefined) {
    normalized.symptoms = normalizedSymptoms;
  }

  if (Object.hasOwn(data, "treatment")) {
    normalized.treatment = normalizeText(data.treatment, 1000);
  }

  if (isCreate || Object.hasOwn(data, "followUpDate")) {
    normalized.followUpDate = parseOptionalDate(
      data.followUpDate,
      "follow-up date",
    );
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

// Create a new medical record
const createMedicalRecord = async (petId, userId, data) => {
  const pet = await verifyPetOwnership(petId, userId);

  const { petId: _ignoredPetId, ...input } = data || {};
  const normalizedPayload = normalizeMedicalRecordPayload(input, {
    isCreate: true,
  });

  if (
    normalizedPayload.followUpDate &&
    normalizedPayload.visitDate &&
    normalizedPayload.followUpDate < normalizedPayload.visitDate
  ) {
    throw {
      statusCode: 400,
      message: "Follow-up date cannot be earlier than visit date",
    };
  }

  const medicalRecord = await MedicalRecord.create({
    ...normalizedPayload,
    petId: petId,
  });

  // Auto-create reminder for follow-up date
  try {
    await reminderService.upsertMedicalFollowUpReminder(
      medicalRecord,
      pet,
      userId,
    );
  } catch (error) {
    console.error("Failed to sync medical follow-up reminder:", error);
    // Don't fail the record creation if reminder sync fails
  }

  return medicalRecord;
};

// Get all medical records for a pet
const getMedicalRecordsByPetId = async (petId, userId, queryParams = {}) => {
  await verifyPetOwnership(petId, userId);

  const {
    page = 1,
    limit = 10,
    sortBy = "visitDate",
    sortOrder = "desc",
    includeDeleted = false,
    startDate,
    endDate,
  } = queryParams;

  if (!ALLOWED_MEDICAL_SORT_FIELDS.has(sortBy)) {
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

  // Date range filter
  if (startDate || endDate) {
    filter.visitDate = {};
    if (startDate) {
      filter.visitDate.$gte = parseDate(startDate, "start date");
    }
    if (endDate) {
      filter.visitDate.$lte = parseDate(endDate, "end date");
    }

    if (
      filter.visitDate.$gte &&
      filter.visitDate.$lte &&
      filter.visitDate.$gte > filter.visitDate.$lte
    ) {
      throw {
        statusCode: 400,
        message: "Start date cannot be later than end date",
      };
    }
  }

  // Pagination
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const medicalRecords = await MedicalRecord.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await MedicalRecord.countDocuments(filter);

  return {
    medicalRecords,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get a single medical record by ID
const getMedicalRecordById = async (recordId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(recordId)) {
    throw { statusCode: 400, message: "Invalid medical record ID" };
  }

  const medicalRecord = await MedicalRecord.findOne({
    _id: recordId,
    petId: toObjectId(petId),
    isDeleted: false,
  });

  if (!medicalRecord) {
    throw { statusCode: 404, message: "Medical record not found" };
  }

  return medicalRecord;
};

// Update a medical record
const updateMedicalRecord = async (recordId, petId, userId, data) => {
  const pet = await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(recordId)) {
    throw { statusCode: 400, message: "Invalid medical record ID" };
  }

  const medicalRecord = await MedicalRecord.findOne({
    _id: recordId,
    petId: petId,
  });

  if (!medicalRecord || medicalRecord.isDeleted) {
    throw { statusCode: 404, message: "Medical record not found" };
  }

  // Remove fields that shouldn't be updated
  const { petId: _ignoredPetId, isDeleted, deletedAt, ...input } = data || {};

  const normalizedPayload = normalizeMedicalRecordPayload(input);

  const effectiveVisitDate =
    normalizedPayload.visitDate || medicalRecord.visitDate;
  const effectiveFollowUpDate = Object.hasOwn(normalizedPayload, "followUpDate")
    ? normalizedPayload.followUpDate
    : medicalRecord.followUpDate;

  if (
    effectiveFollowUpDate &&
    effectiveVisitDate &&
    effectiveFollowUpDate < effectiveVisitDate
  ) {
    throw {
      statusCode: 400,
      message: "Follow-up date cannot be earlier than visit date",
    };
  }

  medicalRecord.set(normalizedPayload);
  await medicalRecord.save();

  try {
    await reminderService.upsertMedicalFollowUpReminder(
      medicalRecord,
      pet,
      userId,
    );
  } catch (error) {
    console.error("Failed to sync medical follow-up reminder:", error);
  }

  return medicalRecord;
};

// Soft delete a medical record
const deleteMedicalRecord = async (recordId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(recordId)) {
    throw { statusCode: 400, message: "Invalid medical record ID" };
  }

  const medicalRecord = await MedicalRecord.findOne({
    _id: recordId,
    petId: petId,
  });

  if (!medicalRecord || medicalRecord.isDeleted) {
    throw { statusCode: 404, message: "Medical record not found" };
  }

  const deletedRecord = await MedicalRecord.findByIdAndUpdate(
    recordId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  try {
    await reminderService.deleteReminderByRelatedRecord(
      medicalRecord._id,
      "MedicalRecord",
    );
  } catch (error) {
    console.error("Failed to delete related medical reminders:", error);
  }

  return deletedRecord;
};

// Get follow-up reminders for a pet
const getFollowUpReminders = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get upcoming follow-ups (next 14 days)
  const fourteenDaysFromNow = new Date(today);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const upcoming = await MedicalRecord.find({
    petId: toObjectId(petId),
    isDeleted: false,
    followUpDate: {
      $gte: today,
      $lte: fourteenDaysFromNow,
    },
  })
    .select("reasonForVisit followUpDate")
    .sort({ followUpDate: 1 })
    .lean();

  // Get overdue follow-ups
  const overdue = await MedicalRecord.find({
    petId: toObjectId(petId),
    isDeleted: false,
    followUpDate: { $lt: today },
  })
    .select("reasonForVisit followUpDate")
    .sort({ followUpDate: 1 })
    .lean();

  return { upcoming, overdue };
};

// Get medical record statistics for a pet
const getMedicalStats = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const petObjectId = toObjectId(petId);

  const total = await MedicalRecord.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  // Get visits by year
  const visitsByYear = await MedicalRecord.aggregate([
    { $match: { petId: petObjectId, isDeleted: false } },
    {
      $group: {
        _id: { $year: "$visitDate" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Get most recent visit
  const recentVisit = await MedicalRecord.findOne({
    petId: petObjectId,
    isDeleted: false,
  }).sort({ visitDate: -1 });

  return {
    total,
    visitsByYear: visitsByYear.map((item) => ({
      year: item._id,
      count: item.count,
    })),
    lastVisit: recentVisit ? recentVisit.visitDate : null,
  };
};

export default {
  createMedicalRecord,
  getMedicalRecordsByPetId,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getFollowUpReminders,
  getMedicalStats,
};
