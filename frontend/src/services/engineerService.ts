import type { EngineerWithAssignments, User } from '@/types';
import api from './api';
import type { ApiResponse } from './authService';

export interface CreateEngineerData {
  name: string;
  email: string;
  password: string;
  skills: string[];
  seniority: 'junior' | 'mid' | 'senior';
  maxCapacity: number;
  department: string;
  role: 'engineer';
}

export const engineerService = {
  async getAllEngineers(filters?: {
    skills?: string;
    seniority?: string;
    department?: string;
    available?: boolean;
  }): Promise<ApiResponse<{engineers: EngineerWithAssignments[]}>> {
    const params = new URLSearchParams();
    if (filters?.skills) params.append('skills', filters.skills);
    if (filters?.seniority) params.append('seniority', filters.seniority);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.available) params.append('available', 'true');

    const response = await api.get(`/engineers?${params.toString()}`);
    return response.data;
  },

  async getEngineerById(id: string): Promise<ApiResponse<EngineerWithAssignments>> {
    const response = await api.get(`/engineers/${id}`);
    return response.data;
  },

  async getEngineerCapacity(id: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/engineers/${id}/capacity`);
    return response.data;
  },

  async createEngineer(engineerData: CreateEngineerData): Promise<ApiResponse<{ user: User; token: string }>> {
    // Engineers are created through the auth/register endpoint
    const response = await api.post('/auth/register', engineerData);
    return response.data;
  },

  async updateEngineer(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put(`/engineers/${id}`, userData);
    return response.data;
  },

  async findSuitableEngineers(requiredSkills: string[], minimumCapacity?: number): Promise<ApiResponse<EngineerWithAssignments[]>> {
    const response = await api.post('/engineers/find-suitable', {
      requiredSkills,
      minimumCapacity,
    });
    return response.data;
  },

  async getOverloadedEngineers(): Promise<ApiResponse<EngineerWithAssignments[]>> {
    const response = await api.get('/engineers/analytics/overloaded');
    return response.data;
  },

  async getUnderutilizedEngineers(): Promise<ApiResponse<EngineerWithAssignments[]>> {
    const response = await api.get('/engineers/analytics/underutilized');
    return response.data;
  },

  async getTeamAnalytics(): Promise<ApiResponse<any>> {
    const response = await api.get('/engineers/analytics/team');
    return response.data;
  },
};