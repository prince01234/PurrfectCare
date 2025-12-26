import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.post('/users', userController.createUser);

export default router;