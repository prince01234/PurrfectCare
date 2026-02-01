import express from "express";
import vaccinationController from "../controllers/vaccinationController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true }); // Enable access to parent route params (petId)

// URL: /api/pets/:petId/vaccinations/stats - Get vaccination statistics
router.get("/stats", auth, vaccinationController.getVaccinationStats);

// URL: /api/pets/:petId/vaccinations/reminders - Get upcoming and overdue vaccinations
router.get("/reminders", auth, vaccinationController.getVaccinationReminders);

// URL: /api/pets/:petId/vaccinations - Get all vaccinations for a pet
router.get("/", auth, vaccinationController.getVaccinations);

// URL: /api/pets/:petId/vaccinations/:vaccinationId - Get a single vaccination record
router.get("/:vaccinationId", auth, vaccinationController.getVaccinationById);

// Requires authentication and verified user

// URL: /api/pets/:petId/vaccinations - Create a new vaccination record
router.post(
  "/",
  auth,
  requireVerified,
  vaccinationController.createVaccination,
);

// URL: /api/pets/:petId/vaccinations/:vaccinationId - Update a vaccination record
router.put(
  "/:vaccinationId",
  auth,
  requireVerified,
  vaccinationController.updateVaccination,
);

// URL: /api/pets/:petId/vaccinations/:vaccinationId - Delete a vaccination record
router.delete(
  "/:vaccinationId",
  auth,
  requireVerified,
  vaccinationController.deleteVaccination,
);

export default router;
