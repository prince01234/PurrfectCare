import express from "express";
import medicalRecordController from "../controllers/medicalRecordController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true }); // Enable access to parent route params (petId)

// URL: /api/pets/:petId/medical-records/stats - Get medical record statistics
router.get("/stats", auth, medicalRecordController.getMedicalStats);

// URL: /api/pets/:petId/medical-records/follow-ups - Get follow-up reminders
router.get("/follow-ups", auth, medicalRecordController.getFollowUpReminders);

// URL: /api/pets/:petId/medical-records - Get all medical records for a pet
router.get("/", auth, medicalRecordController.getMedicalRecords);

// URL: /api/pets/:petId/medical-records/:recordId - Get a single medical record
router.get("/:recordId", auth, medicalRecordController.getMedicalRecordById);

// URL: /api/pets/:petId/medical-records - Create a new medical record
router.post(
  "/",
  auth,
  requireVerified,
  medicalRecordController.createMedicalRecord,
);

// URL: /api/pets/:petId/medical-records/:recordId - Update a medical record
router.put(
  "/:recordId",
  auth,
  requireVerified,
  medicalRecordController.updateMedicalRecord,
);

// URL: /api/pets/:petId/medical-records/:recordId - Delete a medical record
router.delete(
  "/:recordId",
  auth,
  requireVerified,
  medicalRecordController.deleteMedicalRecord,
);

export default router;
