import mongoose from 'mongoose';

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
    type: String,
    trim: true
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);