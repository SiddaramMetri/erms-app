import type { EngineerWithAssignments, Assignment } from '@/types';

export interface CapacityInfo {
  engineerId: string;
  maxCapacity: number;
  currentUtilization: number;
  availableCapacity: number;
  utilizationPercentage: number;
  status: 'available' | 'busy' | 'overloaded';
}

export const getAvailableCapacity = (engineer: EngineerWithAssignments): number => {
  const maxCapacity = engineer.maxCapacity || 100;
  const currentUtilization = engineer.currentUtilization || 0;
  return Math.max(0, maxCapacity - currentUtilization);
};

export const calculateUtilizationFromAssignments = (
  maxCapacity: number, 
  assignments: Assignment[]
): number => {
  if (!assignments || assignments.length === 0) return 0;
  
  const totalAllocated = assignments.reduce((sum, assignment) => {
    return sum + (assignment.allocationPercentage || 0);
  }, 0);
  
  return Math.min(totalAllocated, maxCapacity);
};

export const getCapacityInfo = (engineer: EngineerWithAssignments): CapacityInfo => {
  const maxCapacity = engineer.maxCapacity || 100;
  const currentUtilization = engineer.currentUtilization || 
    calculateUtilizationFromAssignments(maxCapacity, engineer.assignments || []);
  const availableCapacity = Math.max(0, maxCapacity - currentUtilization);
  const utilizationPercentage = (currentUtilization / maxCapacity) * 100;
  
  let status: 'available' | 'busy' | 'overloaded';
  if (utilizationPercentage >= 90) status = 'overloaded';
  else if (utilizationPercentage >= 70) status = 'busy';
  else status = 'available';
  
  return {
    engineerId: engineer._id,
    maxCapacity,
    currentUtilization,
    availableCapacity,
    utilizationPercentage,
    status
  };
};

export const findSuitableEngineers = (
  engineers: EngineerWithAssignments[],
  requiredSkills: string[],
  minimumCapacity: number = 10
): EngineerWithAssignments[] => {
  return engineers.filter(engineer => {
    const hasRequiredSkills = requiredSkills.some(skill => 
      engineer.skills?.some(engineerSkill => 
        engineerSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const hasCapacity = getAvailableCapacity(engineer) >= minimumCapacity;
    
    return hasRequiredSkills && hasCapacity;
  });
};

export const getSkillMatch = (
  engineerSkills: string[], 
  requiredSkills: string[]
): number => {
  if (!engineerSkills || !requiredSkills || requiredSkills.length === 0) return 0;
  
  const matchingSkills = requiredSkills.filter(reqSkill =>
    engineerSkills.some(engSkill => 
      engSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(engSkill.toLowerCase())
    )
  );
  
  return (matchingSkills.length / requiredSkills.length) * 100;
};

export const getTeamCapacityStats = (engineers: EngineerWithAssignments[]) => {
  const stats = engineers.reduce((acc, engineer) => {
    const capacity = getCapacityInfo(engineer);
    
    acc.totalEngineers++;
    acc.totalMaxCapacity += capacity.maxCapacity;
    acc.totalCurrentUtilization += capacity.currentUtilization;
    
    if (capacity.status === 'available') acc.availableEngineers++;
    else if (capacity.status === 'busy') acc.busyEngineers++;
    else if (capacity.status === 'overloaded') acc.overloadedEngineers++;
    
    return acc;
  }, {
    totalEngineers: 0,
    availableEngineers: 0,
    busyEngineers: 0,
    overloadedEngineers: 0,
    totalMaxCapacity: 0,
    totalCurrentUtilization: 0
  });
  
  const totalAvailableCapacity = stats.totalMaxCapacity - stats.totalCurrentUtilization;
  const teamUtilizationPercentage = stats.totalMaxCapacity > 0 
    ? (stats.totalCurrentUtilization / stats.totalMaxCapacity) * 100 
    : 0;
  
  return {
    ...stats,
    totalAvailableCapacity: Math.max(0, totalAvailableCapacity),
    teamUtilizationPercentage
  };
};