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
    validate: [
      {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    ]
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    enum: ['developer', 'lead', 'architect', 'tester', 'devops', 'analyst', 'designer']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for checking if assignment is currently active
assignmentSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate > now;
});

// Static methods
assignmentSchema.statics.findByUser = function(userId, status = null) {
  const query = { engineerId: userId };
  if (status) query.status = status;
  return this.find(query).populate('projectId', 'name status priority endDate');
};

assignmentSchema.statics.findByProject = function(projectId, status = null) {
  const query = { projectId };
  if (status) query.status = status;
  return this.find(query).populate('engineerId', 'name email skills seniority');
};

assignmentSchema.statics.getUserCurrentAllocation = function(userId) {
  const now = new Date();
  return this.aggregate([
    {
      $match: {
        engineerId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gt: now }
      }
    },
    {
      $group: {
        _id: '$engineerId',
        totalAllocation: { $sum: '$allocationPercentage' }
      }
    }
  ]);
};

assignmentSchema.statics.getProjectResourceAllocation = function(projectId) {
  return this.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        status: 'active'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'engineerId',
        foreignField: '_id',
        as: 'engineer'
      }
    },
    {
      $unwind: '$engineer'
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        totalAllocation: { $sum: '$allocationPercentage' },
        engineers: { $push: {
          id: '$engineer._id',
          name: '$engineer.name',
          allocation: '$allocationPercentage'
        }}
      }
    }
  ]);
};

// Compound indexes for better performance
assignmentSchema.index({ engineerId: 1, status: 1 });
assignmentSchema.index({ projectId: 1, status: 1 });
assignmentSchema.index({ status: 1, startDate: 1, endDate: 1 });
assignmentSchema.index({ engineerId: 1, startDate: 1, endDate: 1 });

// Ensure JSON output includes virtuals
assignmentSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Assignment', assignmentSchema);