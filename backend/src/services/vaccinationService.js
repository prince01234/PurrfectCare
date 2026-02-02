import Vaccination, {
  isValidObjectId,
  toObjectId,
} from "../models/Vaccination.js";
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

// Create a new vaccination record
const createVaccination = async (petId, userId, data) => {
  const pet = await verifyPetOwnership(petId, userId);

  // Remove petId from body if provided (we use the URL param)
  delete data.petId;

  const vaccination = await Vaccination.create({
    ...data,
    petId: petId,
  });

  // Auto-create reminder for next vaccination due date
  if (vaccination.nextDueDate) {
    try {
      await reminderService.createVaccinationReminder(vaccination, pet, userId);
    } catch (error) {
      console.error("Failed to create vaccination reminder:", error);
      // Don't fail the vaccination creation if reminder fails
    }
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

  // Build filter
  const filter = { petId: toObjectId(petId) };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  if (status) {
    filter.status = status;
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
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
    petId: petId,
    isDeleted: false,
  });

  if (!vaccination) {
    throw { statusCode: 404, message: "Vaccination record not found" };
  }

  return vaccination;
};

// Update a vaccination record
const updateVaccination = async (vaccinationId, petId, userId, data) => {
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

  // Remove fields that shouldn't be updated
  const { petId: _, isDeleted, deletedAt, ...updateData } = data;

  const updatedVaccination = await Vaccination.findByIdAndUpdate(
    vaccinationId,
    updateData,
    { new: true, runValidators: true },
  );

  return updatedVaccination;
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
    status: { $ne: "completed" },
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
