import express from "express";
import healthController from "../controllers/healthController.js";
import vaccinationRoutes from "./vaccinationRoute.js";
import medicalRecordRoutes from "./medicalRecordRoute.js";
import careLogRoutes from "./careLogRoute.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// ==========================================
// GLOBAL HEALTH ROUTES (for all pets)
// ==========================================

// URL: /api/health/overview - Get health overview for all user's pets
router.get("/overview", auth, healthController.getAllPetsHealthOverview);

// ==========================================
// PET-SPECIFIC HEALTH ROUTES
// Note: These are mounted under /api/pets/:petId in the main pet routes
// ==========================================

// Create a sub-router for pet-specific health routes
const petHealthRouter = express.Router({ mergeParams: true });

// URL: /api/pets/:petId/health - Get health overview for a specific pet
petHealthRouter.get("/", auth, healthController.getHealthOverview);

// Mount sub-routes for vaccinations, medical records, and care logs
petHealthRouter.use("/vaccinations", vaccinationRoutes);
petHealthRouter.use("/medical-records", medicalRecordRoutes);
petHealthRouter.use("/care-logs", careLogRoutes);

export { petHealthRouter };
export default router;
