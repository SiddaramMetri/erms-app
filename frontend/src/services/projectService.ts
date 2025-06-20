import type { Project, ProjectWithAssignments } from '@/types';
import api from './api';
import type { ApiResponse } from './authService';

interface SkillRequirement {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'must-have' | 'nice-to-have';
}

export interface CreateProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills?: SkillRequirement[];
  teamSize: number;
  status?: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  managerId?: string;
  tags?: string[];
}

export const projectService = {
  async getAllProjects(filters?: {
    status?: string;
    priority?: string;
    managerId?: string;
    skills?: string;
  }): Promise<ApiResponse<{projects: ProjectWithAssignments[]}>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.managerId) params.append('managerId', filters.managerId);
    if (filters?.skills) params.append('skills', filters.skills);

    const response = await api.get(`/projects?${params.toString()}`);
    return response.data;
  },

  async getProjectById(id: string): Promise<ApiResponse<ProjectWithAssignments>> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(projectData: CreateProjectData): Promise<ApiResponse<Project>> {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  async updateProject(id: string, projectData: Partial<CreateProjectData>): Promise<ApiResponse<Project>> {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  async deleteProject(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  async getMyProjects(status?: string): Promise<ApiResponse<ProjectWithAssignments[]>> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/projects/my-projects${params}`);
    return response.data;
  },

  async updateProjectProgress(id: string, completionPercentage: number): Promise<ApiResponse<Project>> {
    const response = await api.patch(`/projects/${id}/progress`, { completionPercentage });
    return response.data;
  },

  async getProjectAnalytics(): Promise<ApiResponse<unknown>> {
    const response = await api.get('/projects/analytics');
    return response.data;
  },
};