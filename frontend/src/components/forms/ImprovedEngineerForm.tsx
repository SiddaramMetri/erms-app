import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { X, Plus, Loader2 } from 'lucide-react';
import { engineerService, type CreateEngineerData } from '@/services/engineerService';
import { useForm } from '@/hooks/useForm';
import { commonRules } from '@/utils/formValidation';

interface EngineerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  engineer?: any;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  skills: string[];
  seniority: 'junior' | 'mid' | 'senior';
  maxCapacity: number;
  department: string;
}

const ImprovedEngineerForm: React.FC<EngineerFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  engineer
}) => {
  const { showToast } = useToast();
  const [newSkill, setNewSkill] = useState('');
  const isEditing = !!engineer;

  const initialValues: FormData = {
    name: engineer?.name || '',
    email: engineer?.email || '',
    password: '',
    skills: engineer?.skills || [],
    seniority: engineer?.seniority || 'junior',
    maxCapacity: engineer?.maxCapacity || 100,
    department: engineer?.department || ''
  };

  const validationRules = {
    name: commonRules.name,
    email: commonRules.email,
    password: isEditing ? { minLength: 6 } : commonRules.password,
    department: { required: true, minLength: 2 },
    seniority: { required: true },
    maxCapacity: { required: true, min: 1, max: 100 },
    skills: {
      required: true,
      custom: (value: unknown) => 
        Array.isArray(value) && value.length > 0 ? null : 'At least one skill is required'
    }
  };

  const handleFormSubmit = async (values: FormData) => {
    try {
      let response;
      if (isEditing) {
        const updateData = {
          name: values.name,
          skills: values.skills,
          seniority: values.seniority,
          maxCapacity: values.maxCapacity,
          department: values.department
        };
        response = await engineerService.updateEngineer(engineer._id, updateData);
      } else {
        const submitData: CreateEngineerData = {
          ...values,
          role: 'engineer' as const
        };
        response = await engineerService.createEngineer(submitData);
      }

      if (response.success) {
        showToast({
          type: 'success',
          title: isEditing ? 'Engineer Updated' : 'Engineer Created',
          message: `${values.name} has been ${isEditing ? 'updated' : 'added'} successfully.`
        });
        onSuccess();
        onClose();
        reset();
      } else {
        throw new Error(response.message || 'Something went wrong');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} engineer`
      });
      setError('submit', error.message);
    }
  };

  const {
    values,
    errors,
    isLoading,
    setValue,
    setError,
    handleSubmit,
    reset
  } = useForm({
    initialValues,
    validationRules,
    onSubmit: handleFormSubmit
  });

  const addSkill = () => {
    if (newSkill.trim() && !values.skills.includes(newSkill.trim())) {
      setValue('skills', [...values.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setValue('skills', values.skills.filter(skill => skill !== skillToRemove));
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      if (!isEditing) {
        reset();
      }
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
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
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
              autoComplete="name"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              placeholder="engineer@company.com"
              className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
              autoComplete="email"
              disabled={isEditing} // Can't change email when editing
            />
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
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className={errors.password ? 'border-red-500 focus:border-red-500' : ''}
              autoComplete="new-password"
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
              value={values.department}
              onChange={(e) => setValue('department', e.target.value)}
              placeholder="e.g., Frontend, Backend, DevOps"
              className={errors.department ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seniority">Seniority Level *</Label>
            <select
              id="seniority"
              value={values.seniority}
              onChange={(e) => setValue('seniority', e.target.value as FormData['seniority'])}
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
            value={values.maxCapacity}
            onChange={(e) => setValue('maxCapacity', parseInt(e.target.value) || 100)}
            className={errors.maxCapacity ? 'border-red-500 focus:border-red-500' : ''}
          />
          {errors.maxCapacity && <p className="text-sm text-red-600">{errors.maxCapacity}</p>}
          <p className="text-sm text-slate-500">Maximum workload capacity as a percentage</p>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <Label>Skills *</Label>
          
          {/* Add skill input */}
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g., React, Python, AWS)"
              onKeyDown={handleSkillKeyDown}
            />
            <Button
              type="button"
              onClick={addSkill}
              disabled={!newSkill.trim()}
              className="px-3 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Skills list */}
          {values.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
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

export default ImprovedEngineerForm;