import { Assignment, Engineer, Project } from '../models/index.js';
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

    const query = { isActive: true };

    if (status) query.status = status;
    if (engineerId) query.engineerId = engineerId;
    if (projectId) query.projectId = projectId;

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sort] = sort === 'startDate' || sort === 'endDate' ? -1 : 1;

    let assignments = await Assignment.find(query)
      .populate('engineerId', 'name email seniority')
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
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      isActive: true
    })
    .populate('engineerId', 'name email seniority skills maxCapacity')
    .populate('projectId', 'name description status priority startDate endDate');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
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
    const { error } = validateAssignment(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { engineerId, projectId } = req.body;

    const engineer = await Engineer.findOne({ _id: engineerId, isActive: true });
    if (!engineer) {
      return res.status(404).json({ error: 'Engineer not found' });
    }

    const project = await Project.findOne({ _id: projectId, isActive: true });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assignment = new Assignment(req.body);
    await assignment.save();

    await assignment.populate('engineerId', 'name email seniority');
    await assignment.populate('projectId', 'name status priority');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { error } = validateAssignmentUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('engineerId', 'name email seniority')
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

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      message: 'Assignment deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActiveAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findActive();

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
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const assignments = await Assignment.findCurrent(queryDate)
      .populate('engineerId', 'name email seniority')
      .populate('projectId', 'name status priority');

    res.json({
      success: true,
      data: { 
        assignments,
        queryDate: queryDate.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};