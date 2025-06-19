import { Project, Assignment, Engineer } from '../models/index.js';
import { validateProject, validateProjectUpdate, validateQueryParams } from '../utils/validation.js';

export const getAllProjects = async (req, res) => {
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
      priority,
      managerId
    } = req.query;

    const query = { isActive: true };

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
        const assignmentCount = await Assignment.countDocuments({
          projectId: project._id,
          isActive: true
        });

        return {
          ...project.toJSON(),
          currentTeamSize: assignmentCount,
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
    const project = await Project.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('managerId', 'name email seniority');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assignments = await Assignment.findByProject(project._id)
      .populate('engineerId', 'name email seniority skills');

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
    const { error } = validateProject(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const manager = await Engineer.findById(req.body.managerId);
    if (!manager || !['manager', 'admin'].includes(manager.role)) {
      return res.status(400).json({ error: 'Invalid manager ID or insufficient permissions' });
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
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { error } = validateProjectUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
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