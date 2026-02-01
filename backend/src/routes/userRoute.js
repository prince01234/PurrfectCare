import express from "express";
import multer from "multer";
import userController from "../controllers/userController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// URL: /api/users
router.post("/", userController.createUser);

// URL: /api/users
router.get("/", userController.getUser);

// URL: /api/users/:id
router.get("/:id", userController.getUserById);

// URL: /api/users/:id - Update user profile (including profile image)
router.put("/:id", upload.single("profileImage"), userController.updateUser);

// URL: /api/users/:id
router.delete("/:id", userController.deleteUser);

export default router;
