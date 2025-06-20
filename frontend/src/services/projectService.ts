import type { Project, ProjectWithAssignments } from '@/types';
import api from './api';
// import { Project, ProjectWithAssignments } from '@/types';
import type { ApiResponse } from './authService';
// import { ApiResponse } from './authService';

export interface CreateProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  teamSize: number;
  status?: 'planning' | 'active' | 'completed';
  budget?: number;
  priority?: 'low' | 'medium' | 'high';
}

export const projectService = {
  async getAllProjects(filters?: {
    status?: string;
    priority?: string;
    managerId?: string;
    skills?: string;
  }): Promise<ApiResponse<ProjectWithAssignments[]>> {
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

  async getProjectAnalytics(): Promise<ApiResponse<any>> {
    const response = await api.get('/projects/analytics');
    return response.data;
  },
};