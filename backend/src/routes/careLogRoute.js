import express from "express";
import careLogController from "../controllers/careLogController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true }); // Enable access to parent route params (petId)

// ==========================================
// BROWSING ROUTES (auth only, no verification required)
// ==========================================

// URL: /api/pets/:petId/care-logs/stats - Get care log statistics
router.get("/stats", auth, careLogController.getCareLogStats);

// URL: /api/pets/:petId/care-logs/today - Get today's care logs
router.get("/today", auth, careLogController.getTodayCareLogs);

// URL: /api/pets/:petId/care-logs - Get all care logs for a pet
router.get("/", auth, careLogController.getCareLogs);

// URL: /api/pets/:petId/care-logs/:logId - Get a single care log
router.get("/:logId", auth, careLogController.getCareLogById);

// ==========================================
// ACTION ROUTES (auth + verification required)
// ==========================================

// URL: /api/pets/:petId/care-logs - Create a new care log
router.post("/", auth, requireVerified, careLogController.createCareLog);

// URL: /api/pets/:petId/care-logs/:logId - Update a care log
router.put("/:logId", auth, requireVerified, careLogController.updateCareLog);

// URL: /api/pets/:petId/care-logs/:logId - Delete a care log
router.delete(
  "/:logId",
  auth,
  requireVerified,
  careLogController.deleteCareLog,
);

export default router;
