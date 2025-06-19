import express from 'express';
import { authenticateToken, requireManagerOrAdmin, canAccessEngineer } from '../middleware/auth.js';
import {
  getAllEngineers,
  getEngineerById,
  updateEngineer,
  deleteEngineer,
  getEngineerCapacity,
  getEngineerAssignments,
  searchEngineersBySkill
} from '../controllers/engineerController.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getAllEngineers);
router.get('/search/skill', authenticateToken, searchEngineersBySkill);
router.get('/:id', authenticateToken, canAccessEngineer, getEngineerById);
router.get('/:id/capacity', authenticateToken, canAccessEngineer, getEngineerCapacity);
router.get('/:id/assignments', authenticateToken, canAccessEngineer, getEngineerAssignments);

// Protected routes (manager/admin only)
router.put('/:id', authenticateToken, requireManagerOrAdmin, updateEngineer);
router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteEngineer);

export default router;