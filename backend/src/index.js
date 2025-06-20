import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import assignmentRoutes from './routes/assignments.js';
import analyticsRoutes from './routes/analytics.js';
import errorHandler from './middleware/errorHandler.js';
import configDb from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3300;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "https://erms-app-ruddy.vercel.app"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for development)
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => {
  res.status(200).json({ status: 'Welcome to the Engineering Resource Management System Backend', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/engineers', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (_, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  configDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Serverless function handler for Vercel
export default async function handler(req, res) {
  try {
    await configDb()
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Database connection failed', 
      message: error.message 
    });
  }
}