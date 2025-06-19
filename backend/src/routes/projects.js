import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getAllProjects);
router.get('/:id', authenticateToken, getProjectById);

// Protected routes (manager/admin only)
router.post('/', authenticateToken, requireManagerOrAdmin, createProject);
router.put('/:id', authenticateToken, requireManagerOrAdmin, updateProject);
router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteProject);

export default router;