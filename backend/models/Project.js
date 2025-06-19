import mongoose from 'mongoose';

const projectSkillRequirementSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: [1, 'Count must be at least 1']
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
  requiredSkills: {
    type: [projectSkillRequirementSchema],
    default: []
  },
  teamSize: {
    type: Number,
    required: true,
    min: [1, 'Team size must be at least 1'],
    max: [50, 'Team size cannot exceed 50']
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
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engineer',
    required: [true, 'Manager ID is required']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  estimatedHours: {
    type: Number,
    min: [1, 'Estimated hours must be at least 1']
  },
  actualHours: {
    type: Number,
    default: 0,
    min: [0, 'Actual hours cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ managerId: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ 'requiredSkills.skill': 1 });
projectSchema.index({ isActive: 1 });

// Virtual for project duration in days
projectSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for project progress percentage
projectSchema.virtual('progressPercentage').get(function() {
  if (!this.estimatedHours || this.estimatedHours === 0) return 0;
  return Math.min(100, Math.round((this.actualHours / this.estimatedHours) * 100));
});

// Virtual to check if project is overdue
projectSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && this.endDate < new Date();
});

// Instance method to check if project requires specific skill
projectSchema.methods.requiresSkill = function(skillName, minLevel = 'beginner') {
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const requiredLevelIndex = skillLevels.indexOf(minLevel);
  
  return this.requiredSkills.some(requirement => {
    const skillMatches = requirement.skill.toLowerCase() === skillName.toLowerCase();
    const levelMatches = skillLevels.indexOf(requirement.level) >= requiredLevelIndex;
    return skillMatches && levelMatches;
  });
};

// Instance method to get total required engineers
projectSchema.methods.getTotalRequiredEngineers = function() {
  return this.requiredSkills.reduce((total, skill) => total + skill.count, 0);
};

// Static method to find projects by skill requirement
projectSchema.statics.findBySkillRequirement = function(skillName, minLevel = 'beginner') {
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const minIndex = skillLevels.indexOf(minLevel);
  const validLevels = skillLevels.slice(minIndex);
  
  return this.find({
    isActive: true,
    requiredSkills: {
      $elemMatch: {
        skill: { $regex: new RegExp(skillName, 'i') },
        level: { $in: validLevels }
      }
    }
  });
};

// Static method to find active projects
projectSchema.statics.findActive = function() {
  return this.find({
    isActive: true,
    status: { $in: ['planning', 'active'] }
  });
};

// Pre-save middleware to validate dates
projectSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

export default mongoose.model('Project', projectSchema);