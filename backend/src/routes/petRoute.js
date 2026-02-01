import express from "express";
import petController from "../controllers/petController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// All pet routes require authentication
router.use(auth);

// URL: /api/pets/stats
router.get("/stats", petController.getPetStatistics);

// URL: /api/pets
router.post("/", petController.createPet);

// URL: /api/pets
router.get("/", petController.getPets);

// URL: /api/pets/:id
router.get("/:id", petController.getPetById);

// URL: /api/pets/:id
router.put("/:id", petController.updatePet);

// URL: /api/pets/:id
router.delete("/:id", petController.deletePet);

// URL: /api/pets/:id/restore
router.patch("/:id/restore", petController.restorePet);

export default router;
