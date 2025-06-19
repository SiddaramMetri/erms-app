import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import {
  getTeamUtilization,
  getSkillGaps,
  getProjectHealth
} from '../controllers/analyticsController.js';

const router = express.Router();

// Analytics routes (manager/admin only)
router.get('/team-utilization', authenticateToken, requireManagerOrAdmin, getTeamUtilization);
router.get('/skill-gaps', authenticateToken, requireManagerOrAdmin, getSkillGaps);
router.get('/project-health', authenticateToken, requireManagerOrAdmin, getProjectHealth);

export default router;