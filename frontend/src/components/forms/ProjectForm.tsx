import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { X, Plus, Loader2, Calendar } from 'lucide-react';
import { projectService, type CreateProjectData } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import type { Project, ProjectWithAssignments } from '@/types';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: Project | ProjectWithAssignments; // For editing existing project
}

interface SkillRequirement {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'must-have' | 'nice-to-have';
}

interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills: SkillRequirement[];
  teamSize: number;
  budget: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  tags: string[];
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    requiredSkills: [],
    teamSize: 1,
    budget: 0,
    priority: 'medium',
    status: 'planning',
    tags: []
  });

  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillRequirement['level']>('intermediate');
  const [skillPriority, setSkillPriority] = useState<SkillRequirement['priority']>('must-have');
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!project;

  // Helper function to convert date to YYYY-MM-DD format without timezone issues
  const formatDateForInput = (dateValue: string | Date) => {
    if (!dateValue) return '';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    // Use getFullYear, getMonth, getDate to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Update form data when project prop changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate ? formatDateForInput(project.startDate.toString()) : '',
        endDate: project.endDate ? formatDateForInput(project.endDate.toString()) : '',
        requiredSkills: project.requiredSkills || [],
        teamSize: project.teamSize || 1,
        budget: project.budget || 0,
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        tags: project.tags || []
      });
    } else {
      // Reset form for new project
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        requiredSkills: [],
        teamSize: 1,
        budget: 0,
        priority: 'medium',
        status: 'planning',
        tags: []
      });
    }
  }, [project]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
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

    if (formData.teamSize < 1) {
      newErrors.teamSize = 'Team size must be at least 1';
    }

    if (formData.budget < 0) {
      newErrors.budget = 'Budget cannot be negative';
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.skills = 'At least one required skill must be specified';
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
          name: formData.name,
          description: formData.description,
          startDate: new Date(formData.startDate + 'T12:00:00.000Z').toISOString(),
          endDate: new Date(formData.endDate + 'T12:00:00.000Z').toISOString(),
          requiredSkills: formData.requiredSkills.map(skill => ({
            skill: skill.skill,
            level: skill.level,
            priority: skill.priority
          })),
          teamSize: formData.teamSize,
          budget: formData.budget,
          priority: formData.priority,
          status: formData.status,
          tags: formData.tags
        };
        console.log('Update data:', updateData);
        console.log('Form dates:', { startDate: formData.startDate, endDate: formData.endDate });
        console.log('Parsed dates:', { 
          startDate: new Date(formData.startDate + 'T12:00:00.000Z'), 
          endDate: new Date(formData.endDate + 'T12:00:00.000Z') 
        });
        response = await projectService.updateProject(project._id, updateData);
      } else {
        const submitData: CreateProjectData = {
          name: formData.name,
          description: formData.description,
          startDate: new Date(formData.startDate + 'T12:00:00.000Z').toISOString(),
          endDate: new Date(formData.endDate + 'T12:00:00.000Z').toISOString(),
          requiredSkills: formData.requiredSkills.map(skill => ({
            skill: skill.skill,
            level: skill.level,
            priority: skill.priority
          })),
          teamSize: formData.teamSize,
          status: formData.status,
          budget: formData.budget,
          priority: formData.priority,
          managerId: user?._id || '',
          tags: formData.tags
        };
        console.log('Submitting project data:', submitData);
        response = await projectService.createProject(submitData);
      }

      if (response.success) {
        showToast({
          type: 'success',
          title: isEditing ? 'Project Updated' : 'Project Created',
          message: `${formData.name} has been ${isEditing ? 'updated' : 'created'} successfully.`
        });
        onSuccess();
        onClose();
        resetForm();
      } else {
        setErrors({ submit: response.error || response.message || 'Something went wrong' });
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to save project';
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
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      requiredSkills: [],
      teamSize: 1,
      budget: 0,
      priority: 'medium',
      status: 'planning',
      tags: []
    });
    setNewSkill('');
    setErrors({});
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const skillExists = formData.requiredSkills.some(s => s.skill === newSkill.trim());
      if (!skillExists) {
        const newSkillObj: SkillRequirement = {
          skill: newSkill.trim(),
          level: skillLevel,
          priority: skillPriority
        };
        setFormData(prev => ({
          ...prev,
          requiredSkills: [...prev.requiredSkills, newSkillObj]
        }));
        setNewSkill('');
        setSkillLevel('intermediate');
        setSkillPriority('must-have');
      }
    }
  };

  const removeSkill = (skillToRemove: SkillRequirement) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill.skill !== skillToRemove.skill)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      if (!isEditing) {
        resetForm();
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the project goals, requirements, and scope"
              rows={4}
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>
        </div>

        {/* Timeline */}
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

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size *</Label>
            <Input
              id="teamSize"
              type="number"
              min="1"
              value={formData.teamSize}
              onChange={(e) => setFormData(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 1 }))}
              className={errors.teamSize ? 'border-red-500' : ''}
            />
            {errors.teamSize && <p className="text-sm text-red-600">{errors.teamSize}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (USD) *</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="1000"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className={errors.budget ? 'border-red-500' : ''}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
            {formData.budget > 0 && (
              <p className="text-sm text-slate-500">{formatCurrency(formData.budget)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as FormData['priority'] }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>
        </div>

        {/* Status (only for editing) */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="status">Project Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FormData['status'] }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-3">
          <Label>Project Tags</Label>
          
          {/* Add tag input */}
          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag (e.g., frontend, urgent, mobile)"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim()}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags list */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  <span className="text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Required Skills */}
        <div className="space-y-3">
          <Label>Required Skills *</Label>
          
          {/* Add skill input */}
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Skill name (e.g., React)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillRequirement['level'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <select
                value={skillPriority}
                onChange={(e) => setSkillPriority(e.target.value as SkillRequirement['priority'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="must-have">Must Have</option>
                <option value="nice-to-have">Nice to Have</option>
              </select>
              <Button
                type="button"
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Skills list */}
          {formData.requiredSkills.length > 0 ? (
            <div className="space-y-2">
              {formData.requiredSkills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{skill.skill}</Badge>
                    <span className="text-sm text-gray-600">{skill.level}</span>
                    <Badge variant={skill.priority === 'must-have' ? 'destructive' : 'outline'} className="text-xs">
                      {skill.priority}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No required skills added yet</p>
          )}
          
          {errors.skills && <p className="text-sm text-red-600">{errors.skills}</p>}
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
              isEditing ? 'Update Project' : 'Create Project'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;