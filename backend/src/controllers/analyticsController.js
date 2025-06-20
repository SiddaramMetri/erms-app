import { User, Project, Assignment } from '../models/index.js';

export const getTeamUtilization = async (req, res) => {
  try {
    const { department } = req.query;
    
    const query = { isActive: true };
    if (department) query.department = department;

    const engineers = await User.find(query).select('-password');
    
    const utilizationData = await Promise.all(
      engineers.map(async (engineer) => {
        const allocations = await Assignment.getUserCurrentAllocation(engineer._id);
        const currentUtilization = allocations.length > 0 ? allocations[0].totalAllocation : 0;
        
        return {
          engineerId: engineer._id,
          name: engineer.name,
          department: engineer.department,
          seniority: engineer.seniority,
          maxCapacity: engineer.maxCapacity,
          currentUtilization,
          availableCapacity: Math.max(0, engineer.maxCapacity - currentUtilization),
          utilizationRate: (currentUtilization / engineer.maxCapacity) * 100
        };
      })
    );

    const totalCapacity = utilizationData.reduce((sum, eng) => sum + eng.maxCapacity, 0);
    const totalUtilized = utilizationData.reduce((sum, eng) => sum + eng.currentUtilization, 0);

    res.json({
      success: true,
      data: {
        engineers: utilizationData,
        teamStats: {
          totalUsers: engineers.length,
          totalCapacity,
          totalUtilized,
          teamUtilizationRate: totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0,
          availableCapacity: totalCapacity - totalUtilized
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSkillGaps = async (req, res) => {
  try {
    const projects = await Project.find({ 
      isActive: true, 
      status: { $in: ['planning', 'active'] } 
    });

    const engineers = await User.find({ isActive: true }).select('-password');

    const skillAnalysis = {};

    projects.forEach(project => {
      project.requiredSkills.forEach(requirement => {
        const key = `${requirement.skill}-${requirement.level}`;
        if (!skillAnalysis[key]) {
          skillAnalysis[key] = {
            skill: requirement.skill,
            level: requirement.level,
            demand: 0,
            supply: 0,
            gap: 0
          };
        }
        skillAnalysis[key].demand += requirement.count;
      });
    });

    engineers.forEach(engineer => {
      engineer.skills.forEach(skill => {
        const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const engineerLevelIndex = skillLevels.indexOf(skill.level);
        
        for (let i = 0; i <= engineerLevelIndex; i++) {
          const key = `${skill.skill}-${skillLevels[i]}`;
          if (skillAnalysis[key]) {
            skillAnalysis[key].supply += 1;
          }
        }
      });
    });

    Object.values(skillAnalysis).forEach(analysis => {
      analysis.gap = analysis.demand - analysis.supply;
    });

    const skillGaps = Object.values(skillAnalysis)
      .filter(analysis => analysis.gap > 0)
      .sort((a, b) => b.gap - a.gap);

    res.json({
      success: true,
      data: {
        skillGaps,
        totalGaps: skillGaps.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectHealth = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .populate('managerId', 'name email');

    const projectHealthData = await Promise.all(
      projects.map(async (project) => {
        const assignments = await Assignment.find({
          projectId: project._id,
          isActive: true
        });

        const activeAssignments = assignments.filter(a => a.status === 'active').length;

        let healthScore = 100;

        if (activeAssignments < project.teamSize) {
          healthScore -= ((project.teamSize - activeAssignments) / project.teamSize) * 30;
        }

        if (project.isOverdue) {
          healthScore -= 25;
        }

        healthScore = Math.max(0, Math.min(100, healthScore));

        return {
          projectId: project._id,
          name: project.name,
          status: project.status,
          priority: project.priority,
          manager: project.managerId?.name,
          isOverdue: project.isOverdue,
          requiredTeamSize: project.teamSize,
          currentTeamSize: activeAssignments,
          healthScore: Math.round(healthScore),
          healthStatus: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects: projectHealthData.sort((a, b) => a.healthScore - b.healthScore)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};