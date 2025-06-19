import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.post('/logout', authenticateToken, logout);

export default router;