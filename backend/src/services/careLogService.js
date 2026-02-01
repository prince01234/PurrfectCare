import CareLog, { isValidObjectId, toObjectId } from "../models/CareLog.js";
import Pet from "../models/Pet.js";

/**
 * Verify pet ownership before any operation
 */
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

/**
 * Create a new care log entry
 */
const createCareLog = async (petId, userId, data) => {
  await verifyPetOwnership(petId, userId);

  // Remove petId from body if provided (we use the URL param)
  delete data.petId;

  const careLog = await CareLog.create({
    ...data,
    petId: petId,
  });

  return careLog;
};

/**
 * Get all care logs for a pet
 */
const getCareLogsByPetId = async (petId, userId, queryParams = {}) => {
  await verifyPetOwnership(petId, userId);

  const {
    page = 1,
    limit = 20,
    careType,
    sortBy = "date",
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

  if (careType) {
    filter.careType = careType.toLowerCase();
  }

  // Date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const careLogs = await CareLog.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await CareLog.countDocuments(filter);

  return {
    careLogs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get a single care log by ID
 */
const getCareLogById = async (logId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(logId)) {
    throw { statusCode: 400, message: "Invalid care log ID" };
  }

  const careLog = await CareLog.findOne({
    _id: logId,
    petId: petId,
    isDeleted: false,
  });

  if (!careLog) {
    throw { statusCode: 404, message: "Care log not found" };
  }

  return careLog;
};

/**
 * Update a care log entry
 */
const updateCareLog = async (logId, petId, userId, data) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(logId)) {
    throw { statusCode: 400, message: "Invalid care log ID" };
  }

  const careLog = await CareLog.findOne({
    _id: logId,
    petId: petId,
  });

  if (!careLog || careLog.isDeleted) {
    throw { statusCode: 404, message: "Care log not found" };
  }

  // Remove fields that shouldn't be updated
  const { petId: _, isDeleted, deletedAt, ...updateData } = data;

  const updatedLog = await CareLog.findByIdAndUpdate(logId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedLog;
};

/**
 * Soft delete a care log entry
 */
const deleteCareLog = async (logId, petId, userId) => {
  await verifyPetOwnership(petId, userId);

  if (!isValidObjectId(logId)) {
    throw { statusCode: 400, message: "Invalid care log ID" };
  }

  const careLog = await CareLog.findOne({
    _id: logId,
    petId: petId,
  });

  if (!careLog || careLog.isDeleted) {
    throw { statusCode: 404, message: "Care log not found" };
  }

  const deletedLog = await CareLog.findByIdAndUpdate(
    logId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  return deletedLog;
};

/**
 * Get care log statistics for a pet
 */
const getCareLogStats = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const petObjectId = toObjectId(petId);

  const total = await CareLog.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  // Count by care type
  const byCareType = await CareLog.aggregate([
    { $match: { petId: petObjectId, isDeleted: false } },
    { $group: { _id: "$careType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivity = await CareLog.countDocuments({
    petId: petObjectId,
    isDeleted: false,
    date: { $gte: sevenDaysAgo },
  });

  // Get last care log entry
  const lastEntry = await CareLog.findOne({
    petId: petObjectId,
    isDeleted: false,
  }).sort({ date: -1, createdAt: -1 });

  return {
    total,
    byCareType: byCareType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentActivity,
    lastEntry: lastEntry
      ? {
          careType: lastEntry.careType,
          date: lastEntry.date,
        }
      : null,
  };
};

/**
 * Get care logs summary for today
 */
const getTodayCareLogs = async (petId, userId) => {
  await verifyPetOwnership(petId, userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await CareLog.find({
    petId: toObjectId(petId),
    isDeleted: false,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).sort({ date: -1, createdAt: -1 });

  return todayLogs;
};

export default {
  createCareLog,
  getCareLogsByPetId,
  getCareLogById,
  updateCareLog,
  deleteCareLog,
  getCareLogStats,
  getTodayCareLogs,
};
