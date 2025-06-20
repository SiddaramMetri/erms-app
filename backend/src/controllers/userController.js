import { User, Assignment } from '../models/index.js';
import { validateEngineerUpdate, validateQueryParams } from '../utils/validation.js';

export const getAllUsers = async (req, res) => {
  try {
    const { error } = validateQueryParams(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      page = 1,
      limit = 10,
      sort = 'name',
      search,
      department,
      seniority,
      skill
    } = req.query;

    const query = { role: 'engineer', isActive: true };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Department filter
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Seniority filter
    if (seniority) {
      query.seniority = seniority;
    }

    // Skill filter - updated for new skills structure
    if (skill) {
      query['skills.skill'] = { $regex: skill, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sort] = 1;

    const engineers = await User.find(query)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get current allocations for each engineer
    const engineersWithAllocation = await Promise.all(
      engineers.map(async (engineer) => {
        const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
        const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;
        
        return {
          ...engineer.toJSON(),
          currentUtilization,
          availableCapacity: Math.max(0, engineer.maxCapacity - currentUtilization)
        };
      })
    );

    res.json({
      success: true,
      data: {
        engineers: engineersWithAllocation,
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

export const getUserById = async (req, res) => {
  try {
    const engineer = await User.findOne({
      _id: req.params.id,
      role: 'engineer',
      isActive: true
    }).select('-password');

    if (!engineer) {
      return res.status(404).json({ error: 'Engineer not found' });
    }

    // Get current allocations
    const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
    const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;

    // Get current assignments
    const assignments = await Assignment.findByUser(engineer._id, 'active');

    const engineerData = {
      ...engineer.toJSON(),
      currentUtilization,
      availableCapacity: Math.max(0, engineer.maxCapacity - currentUtilization),
      currentAssignments: assignments
    };

    res.json({
      success: true,
      data: {
        engineer: engineerData
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { error } = validateEngineerUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const engineer = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!engineer) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        engineer
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const engineer = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!engineer) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserCapacity = async (req, res) => {
  try {
    const engineer = await User.findOne({
      _id: req.params.id,
      isActive: true
    }).select('-password');

    if (!engineer) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
    const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;

    // Get assignments for timeline
    const assignments = await Assignment.findByUser(engineer._id)
      .populate('projectId', 'name status priority');

    res.json({
      success: true,
      data: {
        engineerId: engineer._id,
        name: engineer.name,
        maxCapacity: engineer.maxCapacity,
        currentUtilization,
        availableCapacity: Math.max(0, engineer.maxCapacity - currentUtilization),
        utilizationRate: (currentUtilization / engineer.maxCapacity) * 100,
        assignments
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserAssignments = async (req, res) => {
  try {
    const { status } = req.query;

    const assignments = await Assignment.findByUser(req.params.id, status);

    res.json({
      success: true,
      data: {
        assignments
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsersBySkill = async (req, res) => {
  try {
    const { skill, level = 'beginner', available = false } = req.query;

    if (!skill) {
      return res.status(400).json({ error: 'Skill parameter is required' });
    }

    let engineers = await User.findBySkill(skill, level);

    if (available === 'true') {
      // Filter engineers with available capacity
      const engineersWithCapacity = await Promise.all(
        engineers.map(async (engineer) => {
          const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
          const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;
          const availableCapacity = Math.max(0, engineer.maxCapacity - currentUtilization);
          
          return {
            ...engineer.toJSON(),
            currentUtilization,
            availableCapacity
          };
        })
      );

      engineers = engineersWithCapacity.filter(eng => eng.availableCapacity > 0);
    }

    res.json({
      success: true,
      data: {
        engineers,
        searchCriteria: { skill, level, available }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findSuitableUsersForProject = async (req, res) => {
  try {
    const { requiredSkills, minimumCapacity = 10 } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'Required skills array is required' });
    }

    // Find engineers with any of the required skills
    const skillNames = requiredSkills.map(rs => typeof rs === 'string' ? rs : rs.skill);
    const engineers = await User.find({
      role: 'engineer',
      isActive: true,
      'skills.skill': { $in: skillNames.map(skill => new RegExp(skill, 'i')) }
    }).select('-password');

    // Get capacity info for each engineer and calculate skill match
    const suitableUsers = await Promise.all(
      engineers.map(async (engineer) => {
        const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
        const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;
        const availableCapacity = Math.max(0, engineer.maxCapacity - currentUtilization);
        
        // Calculate skill match percentage
        const engineerSkills = engineer.skills.map(s => s.skill);
        const matchingSkills = skillNames.filter(reqSkill =>
          engineerSkills.some(engSkill => 
            engSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
            reqSkill.toLowerCase().includes(engSkill.toLowerCase())
          )
        );
        const skillMatchPercentage = (matchingSkills.length / skillNames.length) * 100;
        
        return {
          ...engineer.toJSON(),
          currentUtilization,
          availableCapacity,
          skillMatchPercentage,
          matchingSkills,
          isAvailable: availableCapacity >= minimumCapacity
        };
      })
    );

    // Filter and sort by availability and skill match
    const filteredUsers = suitableUsers
      .filter(eng => eng.availableCapacity >= minimumCapacity)
      .sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);

    res.json({
      success: true,
      data: {
        engineers: filteredUsers,
        searchCriteria: { requiredSkills, minimumCapacity },
        totalFound: filteredUsers.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};