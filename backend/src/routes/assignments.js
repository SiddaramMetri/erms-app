import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getActiveAssignments,
  getCurrentAssignments
} from '../controllers/assignmentController.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', authenticateToken, getAllAssignments);
router.get('/active', authenticateToken, getActiveAssignments);
router.get('/current', authenticateToken, getCurrentAssignments);
router.get('/:id', authenticateToken, getAssignmentById);

// Protected routes (manager/admin only)
router.post('/', authenticateToken, requireManagerOrAdmin, createAssignment);
router.put('/:id', authenticateToken, requireManagerOrAdmin, updateAssignment);
router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteAssignment);

export default router;