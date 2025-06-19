import bcrypt from 'bcryptjs';
import { Engineer } from '../models/index.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { validateLogin, validateRegister } from '../utils/validation.js';

export const register = async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, department, seniority, maxCapacity, skills, role } = req.body;

    // Check if user already exists
    const existingEngineer = await Engineer.findOne({ email: email.toLowerCase() });
    if (existingEngineer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new engineer
    const engineer = new Engineer({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      department,
      seniority: seniority || 'junior',
      maxCapacity: maxCapacity || 100,
      skills: skills || [],
      role: role || 'engineer'
    });

    await engineer.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(engineer);

    res.status(201).json({
      success: true,
      message: 'Engineer registered successfully',
      data: {
        engineer: engineer.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    // Find engineer
    const engineer = await Engineer.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!engineer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, engineer.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(engineer);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        engineer: engineer.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const engineer = await Engineer.findById(decoded.id).select('-password');

    if (!engineer || !engineer.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(engineer);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        engineer: req.user
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'skills', 'maxCapacity', 'hourlyRate'];
    const updates = {};

    // Only allow certain fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const engineer = await Engineer.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        engineer
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get engineer with password
    const engineer = await Engineer.findById(req.user._id);

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, engineer.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    engineer.password = hashedPassword;
    await engineer.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};