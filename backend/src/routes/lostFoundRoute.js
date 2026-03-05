import express from "express";
import multer from "multer";
import lostFoundController from "../controllers/lostFoundController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Maximum 5 files
  },
});

// URL: /api/lost-found/my-posts - Get authenticated user's posts
router.get("/my-posts", auth, lostFoundController.getMyPosts);

// URL: /api/lost-found/locations - Get post locations for map view
router.get("/locations", lostFoundController.getPostLocations);

// URL: /api/lost-found - Get all posts (public, optional auth for distance)
router.get("/", lostFoundController.getPosts);

// URL: /api/lost-found/:id - Get single post
router.get("/:id", lostFoundController.getPostById);

// URL: /api/lost-found - Create new post
router.post(
  "/",
  auth,
  requireVerified,
  upload.array("photos", 5),
  lostFoundController.createPost,
);

// URL: /api/lost-found/:id - Update post
router.put(
  "/:id",
  auth,
  requireVerified,
  upload.array("photos", 5),
  lostFoundController.updatePost,
);

// URL: /api/lost-found/:id/status - Update post status
router.patch(
  "/:id/status",
  auth,
  requireVerified,
  lostFoundController.updatePostStatus,
);

// URL: /api/lost-found/:id - Delete post
router.delete("/:id", auth, requireVerified, lostFoundController.deletePost);

export default router;
