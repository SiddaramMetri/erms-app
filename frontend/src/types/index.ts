export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'engineer' | 'manager';
  skills?: string[];
  seniority?: 'junior' | 'mid' | 'senior';
  maxCapacity?: number;
  department?: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  requiredSkills: string[];
  teamSize: number;
  status: 'planning' | 'active' | 'completed';
  managerId: string;
}

export interface Assignment {
  _id: string;
  engineerId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: Date;
  endDate: Date;
  role: string;
}

export interface EngineerWithAssignments extends User {
  assignments: Assignment[];
  currentCapacity: number;
  availableCapacity: number;
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