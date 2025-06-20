import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  teamSize: {
    type: Number,
    required: true,
    min: [1, 'Team size must be at least 1']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager ID is required']
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectSchema.index({ status: 1 });
projectSchema.index({ managerId: 1 });

export default mongoose.model('Project', projectSchema);