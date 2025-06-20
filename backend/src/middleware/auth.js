import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure proper ObjectId conversion
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(decoded.id);
    } catch (err) {
      console.error('Invalid ObjectId in token:', decoded.id);
      return next(new AppError('Invalid token format', 401));
    }
    
    const user = await User.findOne({ 
      _id: userId, 
      isActive: true 
    }).select('-password');
    
    if (!user) {
      return next(new AppError('User no longer exists or has been deactivated', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user has required role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        `Access denied. Required role: ${roles.join(' or ')}. Current role: ${req.user.role}`, 
        403
      ));
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
export const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
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