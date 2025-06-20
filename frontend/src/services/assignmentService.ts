import type { Assignment } from '@/types';
import api from './api';
import type { ApiResponse } from './authService';

export interface CreateAssignmentData {
  engineerId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: 'developer' | 'lead' | 'architect' | 'tester' | 'devops' | 'analyst' | 'designer';
  status?: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export const assignmentService = {
  async getAllAssignments(): Promise<ApiResponse<{assignments: Assignment[], pagination?: any}>> {
    const response = await api.get('/assignments');
    return response.data;
  },

  async getMyAssignments(): Promise<ApiResponse<Assignment[]>> {
    const response = await api.get('/assignments/my-assignments');
    return response.data;
  },

  async getCurrentAssignments(): Promise<ApiResponse<{assignments: Assignment[]}>> {
    const response = await api.get('/assignments/current');
    return response.data;
  },

  async getManagedAssignments(): Promise<ApiResponse<Assignment[]>> {
    const response = await api.get('/assignments/managed');
    return response.data;
  },

  async getAssignmentById(id: string): Promise<ApiResponse<Assignment>> {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  async createAssignment(assignmentData: CreateAssignmentData): Promise<ApiResponse<Assignment>> {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  async updateAssignment(id: string, assignmentData: Partial<CreateAssignmentData>): Promise<ApiResponse<Assignment>> {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  async updateAssignmentStatus(id: string, status: 'pending' | 'active' | 'completed'): Promise<ApiResponse<Assignment>> {
    const response = await api.patch(`/assignments/${id}/status`, { status });
    return response.data;
  },

  async updateAssignmentProgress(id: string, completionPercentage: number): Promise<ApiResponse<Assignment>> {
    const response = await api.patch(`/assignments/${id}/progress`, { completionPercentage });
    return response.data;
  },

  async deleteAssignment(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },
};