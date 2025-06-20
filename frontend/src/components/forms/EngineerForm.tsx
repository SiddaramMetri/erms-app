import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { X, Plus, Loader2 } from 'lucide-react';
import { engineerService, type CreateEngineerData } from '@/services/engineerService';
import { validateForm as validateFormData } from '@/utils/formValidation';
import { useToast } from '@/components/ui/toast';
import type { EngineerWithAssignments, Skill } from '@/types';

interface EngineerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  engineer?: EngineerWithAssignments | null;
}

interface FormData extends Record<string, unknown> {
  name: string;
  email: string;
  password: string;
  skills: Skill[];
  seniority: 'junior' | 'mid' | 'senior';
  maxCapacity: number;
  department: string;
}

const EngineerForm: React.FC<EngineerFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  engineer
}) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    skills: [],
    seniority: 'junior',
    maxCapacity: 100,
    department: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState<Skill['level']>('intermediate');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!engineer;

  // Update form data when modal opens or engineer changes
  useEffect(() => {
    if (isOpen) {
      if (engineer) {
        // Pre-fill form with engineer data for editing
        setFormData({
          name: engineer.name || '',
          email: engineer.email || '',
          password: '',
          skills: engineer.skills || [],
          seniority: engineer.seniority || 'junior',
          maxCapacity: engineer.maxCapacity || 100,
          department: engineer.department || ''
        });
      } else {
        // Reset form for new engineer
        setFormData({
          name: '',
          email: '',
          password: '',
          skills: [],
          seniority: 'junior',
          maxCapacity: 100,
          department: ''
        });
      }
      // Clear any existing errors when opening
      setErrors({});
      setNewSkill('');
      setSkillLevel('intermediate');
    }
  }, [engineer, isOpen]);

  const validateForm = (): boolean => {
    const validationRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, email: true },
      ...(isEditing ? {} : { password: { required: true, minLength: 6 } }),
      department: { required: true, minLength: 2, maxLength: 50 },
      maxCapacity: { required: true, min: 1, max: 100 },
      skills: {
        required: true,
        custom: (value: unknown) => {
          if (!Array.isArray(value)) return 'Skills must be an array';
          if (value.length === 0) return 'At least one skill is required';
          return null;
        }
      }
    };

    const result = validateFormData(formData, validationRules);
    setErrors(result.errors);
    return result.isValid;
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
        // Update existing engineer
        // Clean skills array to remove any _id fields that may exist from database
        const cleanSkills = formData.skills.map(skill => ({
          skill: skill.skill,
          level: skill.level
        }));
        
        const updateData = {
          name: formData.name,
          skills: cleanSkills,
          seniority: formData.seniority,
          maxCapacity: formData.maxCapacity,
          department: formData.department
        };
        response = await engineerService.updateEngineer(engineer!._id, updateData);
      } else {
        // Create new engineer via registration
        // Clean skills array to ensure consistent format
        const cleanSkills = formData.skills.map(skill => ({
          skill: skill.skill,
          level: skill.level
        }));
        
        const submitData: CreateEngineerData = {
          ...formData,
          skills: cleanSkills,
          role: 'engineer' as const
        };
        response = await engineerService.createEngineer(submitData);
      }

      if (response.success) {
        showToast({
          type: 'success',
          title: isEditing ? 'Engineer Updated' : 'Engineer Created',
          message: `${formData.name} has been ${isEditing ? 'updated' : 'created'} successfully.`
        });
        resetForm();
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: response.message || 'Something went wrong' });
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to save engineer';
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
      email: '',
      password: '',
      skills: [],
      seniority: 'junior',
      maxCapacity: 100,
      department: ''
    });
    setNewSkill('');
    setSkillLevel('intermediate');
    setErrors({});
    setIsLoading(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.some(s => s.skill === newSkill.trim())) {
      const newSkillObj: Skill = {
        skill: newSkill.trim(),
        level: skillLevel
      };
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkillObj]
      }));
      setNewSkill('');
      setSkillLevel('intermediate');
    }
  };

  const removeSkill = (skillToRemove: Skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.skill !== skillToRemove.skill)
    }));
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Always reset form when closing to ensure clean state
      resetForm();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditing ? 'Edit Engineer' : 'Add New Engineer'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="engineer@gmail.com"
              className={errors.email ? 'border-red-500' : ''}
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-500">Email cannot be changed when editing</p>
            )}
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        {/* Password (only for new engineers) */}
        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password (min 6 characters)"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>
        )}

        {/* Department and Seniority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Frontend, Backend, DevOps"
              className={errors.department ? 'border-red-500' : ''}
            />
            {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seniority">Seniority Level *</Label>
            <select
              id="seniority"
              value={formData.seniority}
              onChange={(e) => setFormData(prev => ({ ...prev, seniority: e.target.value as FormData['seniority'] }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>

        {/* Max Capacity */}
        <div className="space-y-2">
          <Label htmlFor="maxCapacity">Max Capacity (%) *</Label>
          <Input
            id="maxCapacity"
            type="number"
            min="1"
            max="100"
            value={formData.maxCapacity}
            onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 100 }))}
            className={errors.maxCapacity ? 'border-red-500' : ''}
          />
          {errors.maxCapacity && <p className="text-sm text-red-600">{errors.maxCapacity}</p>}
          <p className="text-sm text-slate-500">Maximum workload capacity as a percentage</p>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <Label>Skills *</Label>
          
          {/* Add skill input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g., React, Python, AWS)"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as Skill['level'])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
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

          {/* Skills list */}
          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  <Badge variant="secondary" className="text-sm">
                    {skill.skill}
                  </Badge>
                  <span className="text-xs text-gray-600">({skill.level})</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No skills added yet</p>
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
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Engineer' : 'Create Engineer'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EngineerForm;