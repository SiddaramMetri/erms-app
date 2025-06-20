import express from 'express';
import { authenticateToken, requireManagerOrAdmin, canAccessEngineer } from '../middleware/auth.js';
import {
  getAllUsers as getAllEngineers,
  getUserById as getEngineerById,
  updateUser as updateEngineer,
  deleteUser as deleteEngineer,
  getUserCapacity as getEngineerCapacity,
  getUserAssignments as getEngineerAssignments,
  searchUsersBySkill as searchEngineersBySkill,
  findSuitableUsersForProject as findSuitableEngineersForProject
} from '../controllers/userController.js';

const router = express.Router();

// Parameter validation middleware
router.param('id', (_, res, next, id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid user ID format' 
    });
  }
  next();
});

// Public routes (with authentication)
router.get('/', authenticateToken, getAllEngineers);
router.get('/search/skill', authenticateToken, searchEngineersBySkill);
router.post('/find-suitable', authenticateToken, requireManagerOrAdmin, findSuitableEngineersForProject);

// Individual engineer routes
router.get('/:id', authenticateToken, canAccessEngineer, getEngineerById);
router.get('/:id/capacity', authenticateToken, canAccessEngineer, getEngineerCapacity);
router.get('/:id/assignments', authenticateToken, canAccessEngineer, getEngineerAssignments);

// Protected routes
router.put('/:id', authenticateToken, canAccessEngineer, updateEngineer);
router.delete('/:id', authenticateToken, requireManagerOrAdmin, deleteEngineer);

export default router;