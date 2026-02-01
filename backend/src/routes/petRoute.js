import express from "express";
import multer from "multer";
import petController from "../controllers/petController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Maximum 10 files
  },
});

// ==========================================
// BROWSING ROUTES (auth only, no verification required)
// ==========================================

// URL: /api/pets/stats - View pet statistics
router.get("/stats", auth, petController.getPetStatistics);

// URL: /api/pets - View all pets
router.get("/", auth, petController.getPets);

// URL: /api/pets/:id - View single pet
router.get("/:id", auth, petController.getPetById);

// ==========================================
// ACTION ROUTES (auth + verification required)
// ==========================================

// URL: /api/pets - Create new pet
router.post(
  "/",
  auth,
  requireVerified,
  upload.array("photos", 10),
  petController.createPet,
);

// URL: /api/pets/:id - Update pet
router.put(
  "/:id",
  auth,
  requireVerified,
  upload.array("photos", 10),
  petController.updatePet,
);

// URL: /api/pets/:id/photos - Add photos to existing pet
router.post(
  "/:id/photos",
  auth,
  requireVerified,
  upload.array("photos", 10),
  petController.addPetPhotos,
);

// URL: /api/pets/:id/photos - Delete a specific photo
router.delete(
  "/:id/photos",
  auth,
  requireVerified,
  petController.deletePetPhoto,
);

// URL: /api/pets/:id - Soft delete pet
router.delete("/:id", auth, requireVerified, petController.deletePet);

// URL: /api/pets/:id/permanent - Permanently delete pet and all photos
router.delete(
  "/:id/permanent",
  auth,
  requireVerified,
  petController.permanentlyDeletePet,
);

// URL: /api/pets/:id/restore - Restore soft-deleted pet
router.patch("/:id/restore", auth, requireVerified, petController.restorePet);

export default router;
