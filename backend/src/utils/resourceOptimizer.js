import { User, Project, Assignment } from '../models/index.js';

/**
 * Advanced Resource Allocation Optimizer
 * Provides intelligent suggestions for optimal resource allocation
 */

// Calculate skill match percentage between engineer and project requirements
export const calculateSkillMatch = (engineerSkills = [], requiredSkills = []) => {
  if (!requiredSkills.length) return 100;
  
  const engineerSkillNames = engineerSkills.map(skill => 
    skill.skill?.toLowerCase() || skill.toLowerCase()
  );
  
  const matches = requiredSkills.filter(required => {
    const requiredSkillName = required.skill?.toLowerCase() || required.toLowerCase();
    return engineerSkillNames.some(engineerSkill => 
      engineerSkill.includes(requiredSkillName) || 
      requiredSkillName.includes(engineerSkill)
    );
  });
  
  return (matches.length / requiredSkills.length) * 100;
};

// Calculate current workload balance score
export const calculateWorkloadBalance = async (engineerId) => {
  try {
    const assignments = await Assignment.find({
      engineerId,
      status: 'active'
    }).populate('projectId');

    if (!assignments.length) return 100; // Fully available

    const totalAllocation = assignments.reduce((sum, assignment) => 
      sum + (assignment.allocationPercentage || 0), 0
    );

    // Return balance score (lower is more balanced)
    return Math.max(0, 100 - totalAllocation);
  } catch (error) {
    console.error('Error calculating workload balance:', error);
    return 0;
  }
};

// Get available capacity for an engineer
export const getAvailableCapacity = async (engineerId) => {
  try {
    const engineer = await User.findById(engineerId);
    if (!engineer) return 0;

    const assignments = await Assignment.find({
      engineerId,
      status: 'active'
    });

    const totalAllocated = assignments.reduce((sum, assignment) => 
      sum + (assignment.allocationPercentage || 0), 0
    );

    return Math.max(0, (engineer.maxCapacity || 100) - totalAllocated);
  } catch (error) {
    console.error('Error getting available capacity:', error);
    return 0;
  }
};

// Find optimal engineer assignments for a project
export const suggestOptimalAssignments = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const engineers = await User.find({
      role: 'engineer',
      isActive: true
    });

    const suggestions = await Promise.all(
      engineers.map(async (engineer) => {
        const skillMatch = calculateSkillMatch(engineer.skills, project.requiredSkills);
        const availableCapacity = await getAvailableCapacity(engineer._id);
        const workloadBalance = await calculateWorkloadBalance(engineer._id);
        
        // Calculate priority score for must-have skills
        const mustHaveSkills = project.requiredSkills?.filter(skill => 
          skill.priority === 'must-have'
        ) || [];
        const mustHaveMatch = calculateSkillMatch(engineer.skills, mustHaveSkills);
        
        // Composite scoring algorithm
        const score = (
          skillMatch * 0.4 +           // 40% weight on skill match
          mustHaveMatch * 0.3 +        // 30% weight on must-have skills
          (availableCapacity / 100) * 0.2 +  // 20% weight on availability
          (workloadBalance / 100) * 0.1       // 10% weight on balance
        );

        return {
          engineer: {
            _id: engineer._id,
            name: engineer.name,
            email: engineer.email,
            seniority: engineer.seniority,
            department: engineer.department,
            skills: engineer.skills
          },
          skillMatch: Math.round(skillMatch),
          mustHaveMatch: Math.round(mustHaveMatch),
          availableCapacity,
          workloadBalance: Math.round(workloadBalance),
          score: Math.round(score * 100) / 100,
          recommendation: getRecommendationText(score, availableCapacity, skillMatch)
        };
      })
    );

    // Filter and sort suggestions
    const viableSuggestions = suggestions
      .filter(suggestion => suggestion.availableCapacity > 0)
      .sort((a, b) => b.score - a.score);

    return {
      projectId,
      totalSuggestions: viableSuggestions.length,
      topSuggestions: viableSuggestions.slice(0, project.teamSize * 2), // Return extra options
      optimalTeam: viableSuggestions.slice(0, project.teamSize),
      analysis: {
        averageSkillMatch: viableSuggestions.length ? 
          Math.round(viableSuggestions.reduce((sum, s) => sum + s.skillMatch, 0) / viableSuggestions.length) : 0,
        totalAvailableCapacity: viableSuggestions.reduce((sum, s) => sum + s.availableCapacity, 0),
        skillCoverage: calculateSkillCoverage(project.requiredSkills, viableSuggestions.slice(0, project.teamSize))
      }
    };
  } catch (error) {
    console.error('Error generating assignment suggestions:', error);
    throw error;
  }
};

// Calculate skill coverage for a team
const calculateSkillCoverage = (requiredSkills, teamSuggestions) => {
  if (!requiredSkills?.length || !teamSuggestions.length) return 0;

  const teamSkills = teamSuggestions.flatMap(suggestion => 
    suggestion.engineer.skills || []
  );

  const coveredSkills = requiredSkills.filter(required => {
    const requiredSkillName = required.skill?.toLowerCase() || required.toLowerCase();
    return teamSkills.some(teamSkill => {
      const teamSkillName = teamSkill.skill?.toLowerCase() || teamSkill.toLowerCase();
      return teamSkillName.includes(requiredSkillName) || 
             requiredSkillName.includes(teamSkillName);
    });
  });

  return Math.round((coveredSkills.length / requiredSkills.length) * 100);
};

// Generate recommendation text
const getRecommendationText = (score, availableCapacity, skillMatch) => {
  if (score >= 0.8) return 'Excellent match - highly recommended';
  if (score >= 0.6) return 'Good match - recommended';
  if (score >= 0.4) return 'Fair match - consider if needed';
  if (availableCapacity === 0) return 'Not available - fully allocated';
  if (skillMatch < 30) return 'Poor skill match - not recommended';
  return 'Limited match - use as backup option';
};

// Detect assignment conflicts and overlaps
export const detectAssignmentConflicts = async (engineerId, startDate, endDate, excludeAssignmentId = null) => {
  try {
    const query = {
      engineerId,
      status: 'active',
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    };

    if (excludeAssignmentId) {
      query._id = { $ne: excludeAssignmentId };
    }

    const conflictingAssignments = await Assignment.find(query)
      .populate('projectId', 'name priority')
      .populate('engineerId', 'name');

    return {
      hasConflicts: conflictingAssignments.length > 0,
      conflicts: conflictingAssignments.map(assignment => ({
        assignmentId: assignment._id,
        projectName: assignment.projectId?.name || 'Unknown Project',
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        allocation: assignment.allocationPercentage,
        priority: assignment.projectId?.priority || 'medium'
      }))
    };
  } catch (error) {
    console.error('Error detecting assignment conflicts:', error);
    return { hasConflicts: false, conflicts: [] };
  }
};

// Generate capacity forecast for team planning
export const generateCapacityForecast = async (weeks = 12) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (weeks * 7));

    const engineers = await User.find({ role: 'engineer', isActive: true });
    const assignments = await Assignment.find({
      status: 'active',
      $or: [
        { endDate: { $gte: startDate } },
        { startDate: { $lte: endDate } }
      ]
    }).populate('projectId engineerId');

    const forecast = [];
    
    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weeklyCapacity = engineers.map(engineer => {
        const engineerAssignments = assignments.filter(assignment => 
          assignment.engineerId._id.toString() === engineer._id.toString() &&
          assignment.startDate <= weekEnd &&
          assignment.endDate >= weekStart
        );

        const totalAllocation = engineerAssignments.reduce((sum, assignment) => 
          sum + (assignment.allocationPercentage || 0), 0
        );

        return {
          engineerId: engineer._id,
          engineerName: engineer.name,
          maxCapacity: engineer.maxCapacity || 100,
          allocated: totalAllocation,
          available: Math.max(0, (engineer.maxCapacity || 100) - totalAllocation),
          assignments: engineerAssignments.map(a => ({
            projectName: a.projectId?.name,
            allocation: a.allocationPercentage
          }))
        };
      });

      forecast.push({
        week: week + 1,
        weekStart,
        weekEnd,
        totalCapacity: weeklyCapacity.reduce((sum, e) => sum + e.maxCapacity, 0),
        totalAllocated: weeklyCapacity.reduce((sum, e) => sum + e.allocated, 0),
        totalAvailable: weeklyCapacity.reduce((sum, e) => sum + e.available, 0),
        engineers: weeklyCapacity
      });
    }

    return {
      forecastPeriod: { startDate, endDate, weeks },
      forecast,
      summary: {
        averageUtilization: Math.round(
          forecast.reduce((sum, week) => 
            sum + (week.totalAllocated / week.totalCapacity * 100), 0
          ) / weeks
        ),
        peakUtilization: Math.max(...forecast.map(week => 
          Math.round(week.totalAllocated / week.totalCapacity * 100)
        )),
        lowUtilization: Math.min(...forecast.map(week => 
          Math.round(week.totalAllocated / week.totalCapacity * 100)
        ))
      }
    };
  } catch (error) {
    console.error('Error generating capacity forecast:', error);
    throw error;
  }
};

export default {
  calculateSkillMatch,
  calculateWorkloadBalance,
  getAvailableCapacity,
  suggestOptimalAssignments,
  detectAssignmentConflicts,
  generateCapacityForecast
};