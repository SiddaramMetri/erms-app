import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['engineer', 'manager'],
    required: true
  },
  skills: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  }],
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    required: function() {
      return this.role === 'engineer';
    }
  },
  maxCapacity: {
    type: Number,
    required: function() {
      return this.role === 'engineer';
    },
    min: [1, 'Max capacity must be at least 1'],
    max: [100, 'Max capacity cannot exceed 100']
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'engineer';
    },
    trim: true
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Static methods
userSchema.statics.findBySkill = function(skill, level = 'beginner') {
  return this.find({
    role: 'engineer',
    isActive: true,
    'skills.skill': { $regex: skill, $options: 'i' },
    'skills.level': { $in: ['beginner', 'intermediate', 'advanced', 'expert'].slice(['beginner', 'intermediate', 'advanced', 'expert'].indexOf(level)) }
  }).select('-password');
};

userSchema.statics.findAvailableEngineers = function() {
  return this.find({
    role: 'engineer',
    isActive: true
  }).select('-password');
};

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'skills.skill': 1 });
userSchema.index({ department: 1 });
userSchema.index({ seniority: 1 });

export default mongoose.model('User', userSchema);