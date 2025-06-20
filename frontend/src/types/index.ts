export interface Skill {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'engineer' | 'manager';
  skills?: Skill[];
  seniority?: 'junior' | 'mid' | 'senior';
  maxCapacity?: number;
  department?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequiredSkill {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'must-have' | 'nice-to-have';
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  requiredSkills: RequiredSkill[];
  teamSize: number;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  completionPercentage?: number;
  managerId: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Assignment {
  _id: string;
  engineerId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: Date;
  endDate: Date;
  role: 'developer' | 'lead' | 'architect' | 'tester' | 'devops' | 'analyst' | 'designer';
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EngineerWithAssignments extends User {
  assignments?: Assignment[];
  currentAssignments?: Assignment[];
  currentCapacity?: number;
  currentUtilization?: number;
  availableCapacity?: number;
}

export interface ProjectWithAssignments extends Project {
  assignments: Assignment[];
  assignedEngineers: User[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}