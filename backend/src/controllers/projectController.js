import { Project, Assignment, User } from '../models/index.js';
import { validateProject, validateProjectUpdate, validateQueryParams } from '../utils/validation.js';

export const getAllProjects = async (req, res) => {
  try {
    const { error } = validateQueryParams(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Engineers can only see projects they are assigned to
    if (req.user.role === 'engineer') {
      const engineerAssignments = await Assignment.find({
        engineerId: req.user._id,
        isActive: true
      }).select('projectId');
      
      const projectIds = engineerAssignments.map(assignment => assignment.projectId);
      
      if (projectIds.length === 0) {
        return res.json({
          success: true,
          data: {
            projects: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              pages: 0
            }
          }
        });
      }

      const projects = await Project.find({
        _id: { $in: projectIds },
        isActive: true
      }).populate('managerId', 'name email');

      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const assignments = await Assignment.find({
            projectId: project._id,
            status: 'active'
          }).populate('engineerId', 'name email seniority');

          // Calculate auto-progress based on assignment completion
          const progressData = await Assignment.calculateProjectProgress(project._id);
          const autoCalculatedProgress = progressData.length > 0 ? Math.round(progressData[0].projectProgress) : 0;

          // Use manual progress if set, otherwise use auto-calculated
          const finalProgress = project.completionPercentage !== undefined && project.completionPercentage > 0 
            ? project.completionPercentage 
            : autoCalculatedProgress;

          return {
            ...project.toJSON(),
            assignments: assignments,
            currentTeamSize: assignments.length,
            completionPercentage: finalProgress,
            autoCalculatedProgress: autoCalculatedProgress,
            isOverdue: project.isOverdue,
            durationDays: project.durationDays
          };
        })
      );

      return res.json({
        success: true,
        data: {
          projects: projectsWithStats,
          pagination: {
            page: 1,
            limit: projectsWithStats.length,
            total: projectsWithStats.length,
            pages: 1
          }
        }
      });
    }

    // Manager/Admin can see all projects
    const {
      page = 1,
      limit = 10,
      sort = 'startDate',
      search,
      status,
      priority,
      managerId
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (managerId) query.managerId = managerId;

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sort] = sort === 'startDate' || sort === 'endDate' ? -1 : 1;

    const projects = await Project.find(query)
      .populate('managerId', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const assignments = await Assignment.find({
          projectId: project._id,
          status: 'active'
        }).populate('engineerId', 'name email seniority');

        // Calculate auto-progress based on assignment completion
        const progressData = await Assignment.calculateProjectProgress(project._id);
        const autoCalculatedProgress = progressData.length > 0 ? Math.round(progressData[0].projectProgress) : 0;

        // Use manual progress if set, otherwise use auto-calculated
        const finalProgress = project.completionPercentage !== undefined && project.completionPercentage > 0 
          ? project.completionPercentage 
          : autoCalculatedProgress;

        return {
          ...project.toJSON(),
          assignments: assignments,
          currentTeamSize: assignments.length,
          completionPercentage: finalProgress,
          autoCalculatedProgress: autoCalculatedProgress,
          isOverdue: project.isOverdue,
          durationDays: project.durationDays
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
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

export const getProjectById = async (req, res) => {
  try {
    const projectQuery = {
      _id: req.params.id,
      isActive: true
    };

    // Engineers can only see projects they are assigned to
    if (req.user.role === 'engineer') {
      const engineerAssignment = await Assignment.findOne({
        engineerId: req.user._id,
        projectId: req.params.id,
        isActive: true
      });

      if (!engineerAssignment) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }
    }

    const project = await Project.findOne(projectQuery)
      .populate('managerId', 'name email seniority');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let assignments = await Assignment.findByProject(project._id)
      .populate('engineerId', 'name email seniority skills');

    // Engineers can only see limited assignment data
    if (req.user.role === 'engineer') {
      assignments = assignments.map(assignment => ({
        _id: assignment._id,
        role: assignment.role,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        allocationPercentage: assignment.allocationPercentage,
        status: assignment.status,
        // Only show engineer's own detailed info, others are limited
        engineerId: assignment.engineerId._id.toString() === req.user._id.toString() 
          ? assignment.engineerId 
          : { 
              _id: assignment.engineerId._id, 
              name: assignment.engineerId.name 
            }
      }));
    }

    const projectData = {
      ...project.toJSON(),
      assignments,
      currentTeamSize: assignments.length,
      isOverdue: project.isOverdue,
      durationDays: project.durationDays
    };

    res.json({
      success: true,
      data: { project: projectData }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    console.log('Creating project with data:', req.body);
    
    const { error } = validateProject(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    // Temporarily skip manager validation for debugging
    if (req.body.managerId) {
      const manager = await User.findById(req.body.managerId);
      if (!manager) {
        console.log('Manager not found:', req.body.managerId);
        return res.status(400).json({ error: 'Manager not found' });
      }
      
      if (!['manager', 'admin'].includes(manager.role)) {
        console.log('Insufficient permissions for manager:', manager.role);
        return res.status(400).json({ error: 'User does not have manager or admin permissions' });
      }
    } else {
      console.log('No managerId provided, creating project without manager validation');
    }

    const project = new Project(req.body);
    await project.save();
    await project.populate('managerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    console.log('Updating project with data:', req.body);
    console.log('Project dates:', { startDate: req.body.startDate, endDate: req.body.endDate });
    
    const { error } = validateProjectUpdate(req.body);
    if (error) {
      console.log('Joi validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    // Additional date validation for updates
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      
      if (endDate <= startDate) {
        console.log('Date validation failed:', { startDate, endDate });
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Project update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectProgress = async (req, res) => {
  try {
    const { completionPercentage } = req.body;
    
    if (completionPercentage < 0 || completionPercentage > 100) {
      return res.status(400).json({ error: 'Completion percentage must be between 0 and 100' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { completionPercentage },
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project progress updated successfully',
      data: { project }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await Assignment.updateMany(
      { projectId: req.params.id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Project deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};