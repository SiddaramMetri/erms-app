import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from './src/models/index.js';

dotenv.config();

async function updateProgress() {
  try {
    console.log('🔄 Updating project progress...');
    
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/erms');
    console.log('✅ Connected to database');

    // Update existing projects with progress values
    const updates = [
      { name: 'E-commerce Platform', completionPercentage: 65 },
      { name: 'Mobile App Backend', completionPercentage: 30 },
      { name: 'DevOps Infrastructure', completionPercentage: 0 },
      { name: 'Data Analytics Dashboard', completionPercentage: 85 }
    ];

    for (const update of updates) {
      const result = await Project.updateOne(
        { name: update.name },
        { $set: { completionPercentage: update.completionPercentage } }
      );
      console.log(`📈 Updated "${update.name}" to ${update.completionPercentage}%`);
    }

    console.log('🎉 Progress update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateProgress();