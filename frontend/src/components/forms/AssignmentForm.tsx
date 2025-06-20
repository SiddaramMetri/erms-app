import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Modal from '@/components/ui/modal';
import { Loader2, Calendar, Target } from 'lucide-react';
import { engineerService } from '@/services/engineerService';
import { projectService } from '@/services/projectService';
import { assignmentService, type CreateAssignmentData } from '@/services/assignmentService';
import { useToast } from '@/components/ui/toast';

import type { Assignment, EngineerWithAssignments, Project } from '@/types';

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment?: Assignment | null;
}

interface FormData {
  engineerId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: 'developer' | 'lead' | 'architect' | 'tester' | 'devops' | 'analyst' | 'designer' | '';
  notes?: string;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assignment
}) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    engineerId: assignment?.engineerId || '',
    projectId: assignment?.projectId || '',
    allocationPercentage: assignment?.allocationPercentage || 50,
    startDate: assignment?.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : '',
    endDate: assignment?.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : '',
    role: (assignment?.role as FormData['role']) || '',
    notes: assignment?.notes || ''
  });

  const [engineers, setEngineers] = useState<EngineerWithAssignments[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isEditing = !!assignment;

  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [engineersResponse, projectsResponse] = await Promise.all([
        engineerService.getAllEngineers(),
        projectService.getAllProjects()
      ]);

      if (engineersResponse.success && engineersResponse.data) {
        setEngineers(engineersResponse.data.engineers || []);
      } else {
        console.error('Failed to load engineers:', engineersResponse);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load engineers. Please try again.'
        });
      }
      
      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data.projects || []);
      } else {
        console.error('Failed to load projects:', projectsResponse);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load projects. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load form data. Please try again.'
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.engineerId) {
      newErrors.engineerId = 'Engineer is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.role || formData.role.trim() === '') {
      newErrors.role = 'Role/Position is required';
    }

    if (formData.allocationPercentage < 1 || formData.allocationPercentage > 100) {
      newErrors.allocationPercentage = 'Allocation must be between 1% and 100%';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Check engineer capacity
    const selectedEngineer = engineers.find(eng => eng._id === formData.engineerId);
    if (selectedEngineer) {
      const currentCapacity = selectedEngineer.currentUtilization || 0;
      const maxCapacity = selectedEngineer.maxCapacity || 100;
      const availableCapacity = selectedEngineer.availableCapacity || (maxCapacity - currentCapacity);
      
      if (formData.allocationPercentage > availableCapacity) {
        newErrors.allocationPercentage = `Engineer only has ${availableCapacity}% capacity available`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (isEditing) {
        const updateData = {
          engineerId: formData.engineerId,
          projectId: formData.projectId,
          allocationPercentage: formData.allocationPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          role: formData.role as Exclude<FormData['role'], ''>,
          notes: formData.notes
        };
        response = await assignmentService.updateAssignment(assignment!._id, updateData);
      } else {
        const submitData: CreateAssignmentData = {
          engineerId: formData.engineerId,
          projectId: formData.projectId,
          allocationPercentage: formData.allocationPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          role: formData.role as CreateAssignmentData['role'],
          status: 'active' as const,
          notes: formData.notes
        };
        response = await assignmentService.createAssignment(submitData);
      }

      if (response.success) {
        const selectedEngineer = engineers.find(e => e._id === formData.engineerId);
        const selectedProject = projects.find(p => p._id === formData.projectId);
        
        showToast({
          type: 'success',
          title: isEditing ? 'Assignment Updated' : 'Assignment Created',
          message: `${selectedEngineer?.name || 'Engineer'} ${isEditing ? 'updated on' : 'assigned to'} ${selectedProject?.name || 'project'} successfully.`
        });
        onSuccess();
        onClose();
        resetForm();
      } else {
        setErrors({ submit: response.message || 'Something went wrong' });
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to save assignment';
      setErrors({ submit: errorMessage });
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      engineerId: '',
      projectId: '',
      allocationPercentage: 50,
      startDate: '',
      endDate: '',
      role: '',
      notes: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      if (!isEditing) {
        resetForm();
      }
    }
  };

  const getEngineerCapacityInfo = (engineerId: string) => {
    const engineer = engineers.find(eng => eng._id === engineerId);
    if (!engineer) return null;

    const currentCapacity = engineer.currentUtilization || 0;
    const maxCapacity = engineer.maxCapacity || 100;
    const availableCapacity = engineer.availableCapacity || (maxCapacity - currentCapacity);

    return {
      current: currentCapacity,
      max: maxCapacity,
      available: availableCapacity,
      percentage: (currentCapacity / maxCapacity) * 100
    };
  };

  if (isLoadingData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create Assignment">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading engineers and projects...</span>
        </div>
      </Modal>
    );
  }

  const selectedEngineerCapacity = formData.engineerId ? getEngineerCapacityInfo(formData.engineerId) : null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditing ? 'Edit Assignment' : 'Create New Assignment'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Engineer Selection */}
        <div className="space-y-2">
          <Label htmlFor="engineerId">Select Engineer *</Label>
          <select
            id="engineerId"
            value={formData.engineerId}
            onChange={(e) => setFormData(prev => ({ ...prev, engineerId: e.target.value }))}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.engineerId ? 'border-red-500' : ''}`}
          >
            <option value="">Choose an engineer...</option>
            {engineers.map((engineer) => {
              const capacity = getEngineerCapacityInfo(engineer._id);
              return (
                <option key={engineer._id} value={engineer._id}>
                  {engineer.name} - {engineer.department} ({capacity?.available || 0}% available)
                </option>
              );
            })}
          </select>
          {errors.engineerId && <p className="text-sm text-red-600">{errors.engineerId}</p>}
          
          {/* Engineer capacity info */}
          {selectedEngineerCapacity && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Current Capacity:</span>
                <span className={`font-medium ${selectedEngineerCapacity.percentage > 80 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedEngineerCapacity.current}% / {selectedEngineerCapacity.max}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${selectedEngineerCapacity.percentage > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${selectedEngineerCapacity.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Available: {selectedEngineerCapacity.available}%
              </p>
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="projectId">Select Project *</Label>
          <select
            id="projectId"
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.projectId ? 'border-red-500' : ''}`}
          >
            <option value="">Choose a project...</option>
            {projects.filter(p => p.status !== 'completed').map((project) => (
              <option key={project._id} value={project._id}>
                {project.name} - {project.priority || 'medium'} priority
              </option>
            ))}
          </select>
          {errors.projectId && <p className="text-sm text-red-600">{errors.projectId}</p>}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role/Position *</Label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as FormData['role'] }))}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.role ? 'border-red-500' : ''}`}
          >
            <option value="">Select a role...</option>
            <option value="developer">Developer</option>
            <option value="lead">Tech Lead</option>
            <option value="architect">Architect</option>
            <option value="tester">QA/Tester</option>
            <option value="devops">DevOps Engineer</option>
            <option value="analyst">Business Analyst</option>
            <option value="designer">Designer</option>
          </select>
          {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
        </div>

        {/* Allocation Percentage */}
        <div className="space-y-2">
          <Label htmlFor="allocationPercentage">Allocation Percentage *</Label>
          <div className="relative">
            <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="allocationPercentage"
              type="number"
              min="1"
              max="100"
              value={formData.allocationPercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, allocationPercentage: parseInt(e.target.value) || 50 }))}
              className={`pl-10 ${errors.allocationPercentage ? 'border-red-500' : ''}`}
            />
            <span className="absolute right-3 top-3 text-gray-400 text-sm">%</span>
          </div>
          {errors.allocationPercentage && <p className="text-sm text-red-600">{errors.allocationPercentage}</p>}
          <p className="text-sm text-slate-500">Percentage of engineer's time allocated to this project</p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`pl-10 ${errors.startDate ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`pl-10 ${errors.endDate ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes about this assignment..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
          />
        </div>

        {/* Form submission error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Assignment' : 'Create Assignment'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentForm;