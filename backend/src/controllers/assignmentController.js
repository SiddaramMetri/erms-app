import { Assignment, User, Project } from '../models/index.js';
import { validateAssignment, validateAssignmentUpdate, validateQueryParams } from '../utils/validation.js';

export const getAllAssignments = async (req, res) => {
  try {
    const { error } = validateQueryParams(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      page = 1,
      limit = 10,
      sort = 'startDate',
      search,
      status,
      engineerId,
      projectId
    } = req.query;

    const query = {};

    // Engineers can only see their own assignments
    if (req.user.role === 'engineer') {
      query.engineerId = req.user._id;
    }

    if (status) query.status = status;
    if (engineerId && req.user.role !== 'engineer') query.engineerId = engineerId;
    if (projectId) query.projectId = projectId;

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sort] = sort === 'startDate' || sort === 'endDate' ? -1 : 1;

    let assignments = await Assignment.find(query)
      .populate('engineerId', 'name email seniority department department')
      .populate('projectId', 'name status priority')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Search filter after population
    if (search) {
      assignments = assignments.filter(assignment => 
        assignment.engineerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        assignment.projectId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        assignment.role?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Assignment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Engineers can only see their own assignments
    if (req.user.role === 'engineer') {
      query.engineerId = req.user._id;
    }

    const assignment = await Assignment.findOne(query)
    .populate('engineerId', 'name email seniority department skills maxCapacity')
    .populate('projectId', 'name description status priority startDate endDate');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    res.json({
      success: true,
      data: { assignment }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    console.log('Creating assignment with data:', req.body);
    
    const { error } = validateAssignment(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { engineerId, projectId } = req.body;

    const engineer = await User.findOne({ _id: engineerId, role: 'engineer', isActive: true });
    if (!engineer) {
      console.log('Engineer not found:', engineerId);
      return res.status(404).json({ error: 'Engineer not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project team is already full
    const currentAssignments = await Assignment.countDocuments({
      projectId: projectId,
      status: 'active'
    });

    if (currentAssignments >= project.teamSize) {
      return res.status(400).json({ 
        error: `Project team is full. Maximum team size is ${project.teamSize}, currently has ${currentAssignments} members.` 
      });
    }

    // Check if engineer is already assigned to this project
    const existingAssignment = await Assignment.findOne({
      engineerId: engineerId,
      projectId: projectId,
      status: 'active'
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Engineer is already assigned to this project' 
      });
    }

    // Check engineer's capacity
    const currentAllocations = await Assignment.getUserCurrentAllocation(engineerId);
    const currentUtilization = currentAllocations.length > 0 ? currentAllocations[0].totalAllocation : 0;
    const newTotal = currentUtilization + req.body.allocationPercentage;

    if (newTotal > engineer.maxCapacity) {
      return res.status(400).json({ 
        error: `Engineer capacity exceeded. Current: ${currentUtilization}%, Requested: ${req.body.allocationPercentage}%, Maximum: ${engineer.maxCapacity}%` 
      });
    }

    const assignment = new Assignment({
      ...req.body,
      createdBy: req.user._id
    });
    await assignment.save();

    await assignment.populate('engineerId', 'name email seniority department');
    await assignment.populate('projectId', 'name status priority');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { error } = validateAssignmentUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let { engineerId, projectId } = req.body;

    // Extract IDs if they're objects (from populated data)
    if (engineerId && typeof engineerId === 'object') {
      engineerId = engineerId._id;
    }
    if (projectId && typeof projectId === 'object') {
      projectId = projectId._id;
    }

    // Validate engineer if being updated
    if (engineerId) {
      const engineer = await User.findOne({ _id: engineerId, role: 'engineer', isActive: true });
      if (!engineer) {
        return res.status(404).json({ error: 'Engineer not found' });
      }
    }

    // Validate project if being updated
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    // Prepare update data with extracted IDs
    const updateData = {
      ...req.body,
      ...(engineerId && { engineerId }),
      ...(projectId && { projectId })
    };

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('engineerId', 'name email seniority department')
    .populate('projectId', 'name status priority');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssignmentProgress = async (req, res) => {
  try {
    const { completionPercentage } = req.body;
    
    if (completionPercentage < 0 || completionPercentage > 100) {
      return res.status(400).json({ error: 'Completion percentage must be between 0 and 100' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Engineers can only update their own assignments
    if (req.user.role === 'engineer' && assignment.engineerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update your own assignments' });
    }

    assignment.completionPercentage = completionPercentage;
    await assignment.save();

    // Auto-update project progress based on all assignment completions
    const progressData = await Assignment.calculateProjectProgress(assignment.projectId);
    if (progressData.length > 0) {
      const newProjectProgress = Math.round(progressData[0].projectProgress);
      await Project.findByIdAndUpdate(assignment.projectId, {
        completionPercentage: newProjectProgress
      });
    }

    await assignment.populate('engineerId', 'name email');
    await assignment.populate('projectId', 'name');

    res.json({
      success: true,
      message: 'Assignment progress updated successfully',
      data: { assignment }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    console.log('Deleting assignment:', req.params.id);

    // Check if assignment exists
    const existingAssignment = await Assignment.findById(req.params.id);
    if (!existingAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Actually delete the assignment (hard delete)
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    console.log('Assignment deleted successfully:', assignment._id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getActiveAssignments = async (req, res) => {
  try {
    const query = { status: 'active' };
    
    // Engineers can only see their own active assignments
    if (req.user.role === 'engineer') {
      query.engineerId = req.user._id;
    }

    const assignments = await Assignment.find(query)
      .populate('engineerId', 'name email seniority department')
      .populate('projectId', 'name status priority');

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const assignments = await Assignment.find({
      engineerId: userId,
      status: 'active'
    })
      .populate('engineerId', 'name email seniority department')
      .populate('projectId', 'name status priority');

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};