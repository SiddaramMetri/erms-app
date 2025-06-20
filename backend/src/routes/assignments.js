import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  updateAssignmentProgress,
  deleteAssignment,
  getActiveAssignments,
  getCurrentAssignments,
  getSuggestedAssignments,
  checkAssignmentConflicts,
  getCapacityForecast
} from '../controllers/assignmentController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllAssignments);

router.get('/active', authenticateToken, getActiveAssignments);

router.get('/current', authenticateToken, getCurrentAssignments);

router.get('/:id', authenticateToken, getAssignmentById);

router.post('/', authenticateToken, requireManagerOrAdmin, createAssignment);

router.put('/:id', authenticateToken, requireManagerOrAdmin, updateAssignment);

router.patch('/:id/progress', authenticateToken, updateAssignmentProgress);

router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteAssignment);

// Resource optimization routes
router.get('/suggestions/:projectId', authenticateToken, requireManagerOrAdmin, getSuggestedAssignments);

router.get('/conflicts/check', authenticateToken, requireManagerOrAdmin, checkAssignmentConflicts);

router.get('/forecast/capacity', authenticateToken, requireManagerOrAdmin, getCapacityForecast);

export default router;