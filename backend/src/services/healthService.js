import Pet from "../models/Pet.js";
import Vaccination, {
  isValidObjectId,
  toObjectId,
} from "../models/Vaccination.js";
import MedicalRecord from "../models/MedicalRecord.js";
import CareLog from "../models/CareLog.js";

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
 * Get complete health overview for a pet
 */
const getHealthOverview = async (petId, userId) => {
  const pet = await verifyPetOwnership(petId, userId);
  const petObjectId = toObjectId(petId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get vaccination stats
  const totalVaccinations = await Vaccination.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  const overdueVaccinations = await Vaccination.countDocuments({
    petId: petObjectId,
    isDeleted: false,
    nextDueDate: { $lt: today },
  });

  const upcomingVaccinations = await Vaccination.find({
    petId: petObjectId,
    isDeleted: false,
    nextDueDate: {
      $gte: today,
      $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
    },
  })
    .sort({ nextDueDate: 1 })
    .limit(5);

  // Get medical record stats
  const totalMedicalRecords = await MedicalRecord.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  const lastMedicalVisit = await MedicalRecord.findOne({
    petId: petObjectId,
    isDeleted: false,
  }).sort({ visitDate: -1 });

  const upcomingFollowUps = await MedicalRecord.find({
    petId: petObjectId,
    isDeleted: false,
    followUpDate: {
      $gte: today,
      $lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
    },
  })
    .sort({ followUpDate: 1 })
    .limit(5);

  // Get care log stats
  const totalCareLogs = await CareLog.countDocuments({
    petId: petObjectId,
    isDeleted: false,
  });

  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCareLogs = await CareLog.countDocuments({
    petId: petObjectId,
    isDeleted: false,
    date: { $gte: sevenDaysAgo },
  });

  const careLogsByType = await CareLog.aggregate([
    {
      $match: {
        petId: petObjectId,
        isDeleted: false,
        date: { $gte: sevenDaysAgo },
      },
    },
    { $group: { _id: "$careType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Get today's care activities
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayActivities = await CareLog.find({
    petId: petObjectId,
    isDeleted: false,
    date: { $gte: today, $lt: tomorrow },
  }).sort({ date: -1, createdAt: -1 });

  return {
    pet: {
      id: pet._id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.calculatedAge,
    },
    vaccinations: {
      total: totalVaccinations,
      overdue: overdueVaccinations,
      upcoming: upcomingVaccinations,
    },
    medicalRecords: {
      total: totalMedicalRecords,
      lastVisit: lastMedicalVisit
        ? {
            date: lastMedicalVisit.visitDate,
            reason: lastMedicalVisit.reasonForVisit,
            vetName: lastMedicalVisit.vetName,
          }
        : null,
      upcomingFollowUps,
    },
    careLogs: {
      total: totalCareLogs,
      lastWeek: recentCareLogs,
      byType: careLogsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      today: todayActivities,
    },
    alerts: {
      overdueVaccinations: overdueVaccinations,
      upcomingVaccinationsCount: upcomingVaccinations.length,
      pendingFollowUps: upcomingFollowUps.length,
    },
  };
};

/**
 * Get health overview for all pets of a user
 */
const getAllPetsHealthOverview = async (userId) => {
  const pets = await Pet.find({ userId: userId, isDeleted: false });

  if (pets.length === 0) {
    return {
      totalPets: 0,
      pets: [],
      summary: {
        totalVaccinations: 0,
        overdueVaccinations: 0,
        totalMedicalRecords: 0,
        totalCareLogs: 0,
      },
    };
  }

  const petIds = pets.map((pet) => pet._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aggregate stats across all pets
  const totalVaccinations = await Vaccination.countDocuments({
    petId: { $in: petIds },
    isDeleted: false,
  });

  const overdueVaccinations = await Vaccination.countDocuments({
    petId: { $in: petIds },
    isDeleted: false,
    nextDueDate: { $lt: today },
  });

  const totalMedicalRecords = await MedicalRecord.countDocuments({
    petId: { $in: petIds },
    isDeleted: false,
  });

  const totalCareLogs = await CareLog.countDocuments({
    petId: { $in: petIds },
    isDeleted: false,
  });

  // Get per-pet summary
  const petSummaries = await Promise.all(
    pets.map(async (pet) => {
      const petVaccinations = await Vaccination.countDocuments({
        petId: pet._id,
        isDeleted: false,
      });

      const petOverdue = await Vaccination.countDocuments({
        petId: pet._id,
        isDeleted: false,
        nextDueDate: { $lt: today },
      });

      const lastVisit = await MedicalRecord.findOne({
        petId: pet._id,
        isDeleted: false,
      }).sort({ visitDate: -1 });

      return {
        id: pet._id,
        name: pet.name,
        species: pet.species,
        vaccinations: petVaccinations,
        overdueVaccinations: petOverdue,
        lastMedicalVisit: lastVisit ? lastVisit.visitDate : null,
      };
    }),
  );

  return {
    totalPets: pets.length,
    pets: petSummaries,
    summary: {
      totalVaccinations,
      overdueVaccinations,
      totalMedicalRecords,
      totalCareLogs,
    },
  };
};

export default {
  getHealthOverview,
  getAllPetsHealthOverview,
};
