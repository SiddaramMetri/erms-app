import jwt from 'jsonwebtoken';
import { Engineer } from '../models/index.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const engineer = await Engineer.findById(decoded.id).select('-password');
    
    if (!engineer || !engineer.isActive) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = engineer;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

// Middleware to check if user has required role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user is manager or admin
export const requireManagerOrAdmin = requireRole('manager', 'admin');

// Middleware to check if user is admin
export const requireAdmin = requireRole('admin');

// Middleware to check if user can access engineer data (self, manager, or admin)
export const canAccessEngineer = async (req, res, next) => {
  try {
    const targetEngineerId = req.params.id || req.params.engineerId;
    const currentUser = req.user;

    // Admin can access anyone
    if (currentUser.role === 'admin') {
      return next();
    }

    // User can access their own data
    if (currentUser._id.toString() === targetEngineerId) {
      return next();
    }

    // Manager can access engineers in their projects
    if (currentUser.role === 'manager') {
      // This would need project-specific logic
      // For now, allow managers to access any engineer
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Generate JWT tokens
export const generateTokens = (engineer) => {
  const payload = {
    id: engineer._id,
    email: engineer.email,
    role: engineer.role
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};