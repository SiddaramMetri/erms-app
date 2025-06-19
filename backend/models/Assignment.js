import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engineer',
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
    min: [1, 'Allocation percentage must be at least 1%'],
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
    trim: true,
    enum: ['Developer', 'Senior Developer', 'Tech Lead', 'Architect', 'QA Engineer', 'DevOps Engineer', 'Product Manager', 'Designer'],
    default: 'Developer'
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative']
  },
  actualHours: {
    type: Number,
    default: 0,
    min: [0, 'Actual hours cannot be negative']
  },
  billableRate: {
    type: Number,
    min: [0, 'Billable rate cannot be negative']
  },
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
assignmentSchema.index({ engineerId: 1 });
assignmentSchema.index({ projectId: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ startDate: 1, endDate: 1 });
assignmentSchema.index({ engineerId: 1, status: 1 });
assignmentSchema.index({ projectId: 1, status: 1 });
assignmentSchema.index({ isActive: 1 });

// Compound index for efficient capacity queries
assignmentSchema.index({ 
  engineerId: 1, 
  status: 1, 
  startDate: 1, 
  endDate: 1 
});

// Virtual for assignment duration in days
assignmentSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for assignment progress percentage
assignmentSchema.virtual('progressPercentage').get(function() {
  if (!this.estimatedHours || this.estimatedHours === 0) return 0;
  return Math.min(100, Math.round((this.actualHours / this.estimatedHours) * 100));
});

// Virtual to check if assignment is current (active and within date range)
assignmentSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && this.endDate < new Date();
});

// Virtual for total estimated cost
assignmentSchema.virtual('estimatedCost').get(function() {
  if (!this.estimatedHours || !this.billableRate) return 0;
  return this.estimatedHours * this.billableRate;
});

// Virtual for actual cost
assignmentSchema.virtual('actualCost').get(function() {
  if (!this.actualHours || !this.billableRate) return 0;
  return this.actualHours * this.billableRate;
});

// Instance method to check if assignment overlaps with given date range
assignmentSchema.methods.overlapsWithDateRange = function(startDate, endDate) {
  return this.startDate <= endDate && this.endDate >= startDate;
};

// Instance method to get allocation for specific date range
assignmentSchema.methods.getAllocationForDateRange = function(startDate, endDate) {
  if (!this.overlapsWithDateRange(startDate, endDate)) return 0;
  
  const assignmentStart = new Date(Math.max(this.startDate, startDate));
  const assignmentEnd = new Date(Math.min(this.endDate, endDate));
  const overlapDays = Math.ceil((assignmentEnd - assignmentStart) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  return (overlapDays / totalDays) * this.allocationPercentage;
};

// Static method to find assignments by engineer
assignmentSchema.statics.findByEngineer = function(engineerId, status = null) {
  const query = { engineerId, isActive: true };
  if (status) query.status = status;
  return this.find(query).populate('projectId', 'name status priority');
};

// Static method to find assignments by project
assignmentSchema.statics.findByProject = function(projectId, status = null) {
  const query = { projectId, isActive: true };
  if (status) query.status = status;
  return this.find(query).populate('engineerId', 'name email seniority');
};

// Static method to find active assignments
assignmentSchema.statics.findActive = function() {
  return this.find({
    isActive: true,
    status: 'active'
  }).populate('engineerId', 'name email seniority')
    .populate('projectId', 'name status priority');
};

// Static method to find current assignments (active and within date range)
assignmentSchema.statics.findCurrent = function(date = new Date()) {
  return this.find({
    isActive: true,
    status: 'active',
    startDate: { $lte: date },
    endDate: { $gte: date }
  });
};

// Static method to get engineer's current allocation
assignmentSchema.statics.getEngineerCurrentAllocation = function(engineerId, date = new Date()) {
  return this.aggregate([
    {
      $match: {
        engineerId: new mongoose.Types.ObjectId(engineerId),
        isActive: true,
        status: 'active',
        startDate: { $lte: date },
        endDate: { $gte: date }
      }
    },
    {
      $group: {
        _id: null,
        totalAllocation: { $sum: '$allocationPercentage' }
      }
    }
  ]);
};

// Pre-save middleware to validate dates and allocation
assignmentSchema.pre('save', async function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }

  // Check for allocation conflicts (engineer over-allocated)
  if (this.isNew || this.isModified('allocationPercentage') || this.isModified('startDate') || this.isModified('endDate')) {
    const conflictingAssignments = await this.constructor.find({
      _id: { $ne: this._id },
      engineerId: this.engineerId,
      isActive: true,
      status: { $in: ['planned', 'active'] },
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate }
        }
      ]
    });

    const totalAllocation = conflictingAssignments.reduce((sum, assignment) => {
      return sum + assignment.allocationPercentage;
    }, this.allocationPercentage);

    if (totalAllocation > 100) {
      return next(new Error(`Engineer allocation would exceed 100% (current: ${totalAllocation}%)`));
    }
  }

  next();
});

export default mongoose.model('Assignment', assignmentSchema);