import mongoose from 'mongoose';

const skillLevelSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  }
}, { _id: false });

const engineerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  skills: {
    type: [skillLevelSchema],
    default: []
  },
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'lead'],
    required: true,
    default: 'junior'
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: [1, 'Max capacity must be at least 1'],
    max: [100, 'Max capacity cannot exceed 100'],
    default: 100
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['engineer', 'manager', 'admin'],
    default: 'engineer'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
engineerSchema.index({ email: 1 });
engineerSchema.index({ department: 1 });
engineerSchema.index({ seniority: 1 });
engineerSchema.index({ 'skills.skill': 1 });
engineerSchema.index({ isActive: 1 });

// Virtual for current utilization (to be populated from assignments)
engineerSchema.virtual('currentUtilization').get(function() {
  return this._currentUtilization || 0;
});

engineerSchema.virtual('availableCapacity').get(function() {
  return Math.max(0, this.maxCapacity - (this.currentUtilization || 0));
});

// Instance method to check if engineer has specific skill
engineerSchema.methods.hasSkill = function(skillName, minLevel = 'beginner') {
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const requiredLevelIndex = skillLevels.indexOf(minLevel);
  
  const engineerSkill = this.skills.find(s => s.skill.toLowerCase() === skillName.toLowerCase());
  if (!engineerSkill) return false;
  
  const engineerLevelIndex = skillLevels.indexOf(engineerSkill.level);
  return engineerLevelIndex >= requiredLevelIndex;
};

// Static method to find engineers by skill
engineerSchema.statics.findBySkill = function(skillName, minLevel = 'beginner') {
  return this.find({
    isActive: true,
    skills: {
      $elemMatch: {
        skill: { $regex: new RegExp(skillName, 'i') },
        level: { $in: this.getSkillLevelsFromMinimum(minLevel) }
      }
    }
  });
};

// Helper static method
engineerSchema.statics.getSkillLevelsFromMinimum = function(minLevel) {
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const minIndex = skillLevels.indexOf(minLevel);
  return skillLevels.slice(minIndex);
};

export default mongoose.model('Engineer', engineerSchema);