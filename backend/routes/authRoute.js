import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// URL: /api/auth/register
router.post('/register', authController.registerUser);

export default router;