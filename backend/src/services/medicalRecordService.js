import MedicalRecord, {
  isValidObjectId,
  toObjectId,
} from "../models/MedicalRecord.js";
import Pet from "../models/Pet.js";
import reminderService from "./reminderService.js";

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


  const medicalRecord = await MedicalRecord.create({
    ...data,
    petId: petId,
  });

  // Auto-create reminder for follow-up date
  if (medicalRecord.followUpDate) {
    try {
      await reminderService.createMedicalFollowUpReminder(
        medicalRecord,
        pet,
        userId,
      );
    } catch (error) {
      console.error("Failed to create medical follow-up reminder:", error);
      // Don't fail the record creation if reminder fails
    }
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

  // Build filter
  const filter = { petId: toObjectId(petId) };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.visitDate = {};
    if (startDate) {
      filter.visitDate.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.visitDate.$lte = new Date(endDate);
    }
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
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
    petId: petId,
    isDeleted: false,
  });

  if (!medicalRecord) {
    throw { statusCode: 404, message: "Medical record not found" };
  }

  return medicalRecord;
};

// Update a medical record
const updateMedicalRecord = async (recordId, petId, userId, data) => {
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

  // Remove fields that shouldn't be updated
  const { petId: _, isDeleted, deletedAt, ...updateData } = data;

  const updatedRecord = await MedicalRecord.findByIdAndUpdate(
    recordId,
    updateData,
    { new: true, runValidators: true },
  );

  return updatedRecord;
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
