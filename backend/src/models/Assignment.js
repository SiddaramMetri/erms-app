import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Engineer ID is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  allocationPercentage: {
    type: Number,
    required: [true, 'Allocation percentage is required'],
    min: [0, 'Allocation percentage cannot be negative'],
    max: [100, 'Allocation percentage cannot exceed 100%']
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
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
assignmentSchema.index({ engineerId: 1 });
assignmentSchema.index({ projectId: 1 });

export default mongoose.model('Assignment', assignmentSchema);