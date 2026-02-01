import express from "express";
import multer from "multer";
import petController from "../controllers/petController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Maximum 10 files
  },
});

// All pet routes require authentication
router.use(auth);

// URL: /api/pets/stats
router.get("/stats", petController.getPetStatistics);

// URL: /api/pets
router.post("/", upload.array("photos", 10), petController.createPet);

// URL: /api/pets
router.get("/", petController.getPets);

// URL: /api/pets/:id
router.get("/:id", petController.getPetById);

// URL: /api/pets/:id
router.put("/:id", upload.array("photos", 10), petController.updatePet);

// URL: /api/pets/:id/photos - Add photos to existing pet
router.post(
  "/:id/photos",
  upload.array("photos", 10),
  petController.addPetPhotos,
);

// URL: /api/pets/:id/photos - Delete a specific photo
router.delete("/:id/photos", petController.deletePetPhoto);

// URL: /api/pets/:id
router.delete("/:id", petController.deletePet);

// URL: /api/pets/:id/permanent - Permanently delete pet and all photos
router.delete("/:id/permanent", petController.permanentlyDeletePet);

// URL: /api/pets/:id/restore
router.patch("/:id/restore", petController.restorePet);

export default router;
