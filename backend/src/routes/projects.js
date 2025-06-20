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

router.get('/', authenticateToken, getAllProjects);

router.get('/:id', authenticateToken, getProjectById);

router.post('/', authenticateToken, requireManagerOrAdmin, createProject);

router.put('/:id', authenticateToken, requireManagerOrAdmin, updateProject);

router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteProject);

export default router;