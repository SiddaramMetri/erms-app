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
    required: [true, 'End date is required']
  },
  requiredSkills: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    priority: {
      type: String,
      enum: ['must-have', 'nice-to-have'],
      default: 'must-have'
    }
  }],
  teamSize: {
    type: Number,
    required: true,
    min: [1, 'Team size must be at least 1']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  actualStartDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  completionPercentage: {
    type: Number,
    min: [0, 'Completion percentage cannot be negative'],
    max: [100, 'Completion percentage cannot exceed 100'],
    default: 0
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager ID is required']
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual properties
projectSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > this.endDate;
});

projectSchema.virtual('duration').get(function() {
  if (this.actualStartDate && this.actualEndDate) {
    return Math.ceil((this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Static methods
projectSchema.statics.findByManager = function(managerId, status = null) {
  const query = { managerId };
  if (status) query.status = status;
  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

projectSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('managerId', 'name email');
};

projectSchema.statics.findOverdueProjects = function() {
  return this.find({
    status: 'active',
    endDate: { $lt: new Date() }
  }).populate('managerId', 'name email');
};

projectSchema.statics.getProjectStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletion: { $avg: '$completionPercentage' }
      }
    }
  ]);
};

// Middleware to update actualStartDate when status changes to active
projectSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.actualStartDate) {
    this.actualStartDate = new Date();
  }
  if (this.isModified('status') && this.status === 'completed' && !this.actualEndDate) {
    this.actualEndDate = new Date();
    this.completionPercentage = 100;
  }
  next();
});

// Pre-validate hook to handle date validation more intelligently
projectSchema.pre('validate', function(next) {
  // Custom date validation to handle edge cases
  if (this.startDate && this.endDate) {
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    
    if (endDate <= startDate) {
      this.invalidate('endDate', 'End date must be after start date');
    }
  }
  next();
});

// Indexes for better performance
projectSchema.index({ status: 1 });
projectSchema.index({ managerId: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ 'requiredSkills.skill': 1 });
projectSchema.index({ tags: 1 });

// Ensure JSON output includes virtuals  
projectSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Project', projectSchema);