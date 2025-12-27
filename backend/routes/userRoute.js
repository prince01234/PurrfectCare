import express from "express";
import userController from "../controllers/userController.js";

const router = express.Router();

//URL: /api/users
router.post("/", userController.createUser);

//URL: /api/users
router.get("/", userController.getUser);

//URL: /api/users/:id
router.get("/:id", userController.getUserById);

export default router;
