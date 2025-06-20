import Joi from 'joi';

// Engineer validation schemas
export const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    department: Joi.string().min(2).max(50).required(),
    seniority: Joi.string().valid('junior', 'mid', 'senior', 'lead').optional(),
    maxCapacity: Joi.number().min(1).max(100).optional(),
    hourlyRate: Joi.number().min(0).optional(),
    skills: Joi.array().items(
      Joi.object({
        skill: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required()
      })
    ).optional(),
    role: Joi.string().valid('engineer', 'manager', 'admin').optional()
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

export const validateEngineerUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    department: Joi.string().min(2).max(50).optional(),
    seniority: Joi.string().valid('junior', 'mid', 'senior', 'lead').optional(),
    maxCapacity: Joi.number().min(1).max(100).optional(),
    hourlyRate: Joi.number().min(0).optional(),
    skills: Joi.array().items(
      Joi.object({
        skill: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required()
      })
    ).optional(),
    role: Joi.string().valid('engineer', 'manager', 'admin').optional(),
    isActive: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Project validation schemas
export const validateProject = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    requiredSkills: Joi.array().items(
      Joi.object({
        skill: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
        count: Joi.number().min(1).required()
      })
    ).optional(),
    teamSize: Joi.number().min(1).max(50).required(),
    status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    managerId: Joi.string().optional(),
    budget: Joi.number().min(0).optional(),
    estimatedHours: Joi.number().min(1).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(data);
};

export const validateProjectUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    requiredSkills: Joi.array().items(
      Joi.object({
        skill: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
        count: Joi.number().min(1).required()
      })
    ).optional(),
    teamSize: Joi.number().min(1).max(50).optional(),
    status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    budget: Joi.number().min(0).optional(),
    estimatedHours: Joi.number().min(1).optional(),
    actualHours: Joi.number().min(0).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Assignment validation schemas
export const validateAssignment = (data) => {
  const schema = Joi.object({
    engineerId: Joi.string().required(),
    projectId: Joi.string().required(),
    allocationPercentage: Joi.number().min(1).max(100).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    role: Joi.string().valid('Developer', 'Senior Developer', 'Tech Lead', 'Architect', 'QA Engineer', 'DevOps Engineer', 'Product Manager', 'Designer').required(),
    status: Joi.string().valid('planned', 'active', 'completed', 'cancelled').optional(),
    notes: Joi.string().max(500).optional(),
    estimatedHours: Joi.number().min(0).optional(),
    billableRate: Joi.number().min(0).optional()
  });

  return schema.validate(data);
};

export const validateAssignmentUpdate = (data) => {
  const schema = Joi.object({
    allocationPercentage: Joi.number().min(1).max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    role: Joi.string().valid('Developer', 'Senior Developer', 'Tech Lead', 'Architect', 'QA Engineer', 'DevOps Engineer', 'Product Manager', 'Designer').optional(),
    status: Joi.string().valid('planned', 'active', 'completed', 'cancelled').optional(),
    notes: Joi.string().max(500).optional(),
    estimatedHours: Joi.number().min(0).optional(),
    actualHours: Joi.number().min(0).optional(),
    billableRate: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Query parameter validation
export const validateQueryParams = (data) => {
  const schema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    status: Joi.string().optional(),
    department: Joi.string().optional(),
    seniority: Joi.string().valid('junior', 'mid', 'senior', 'lead').optional(),
    skill: Joi.string().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    managerId: Joi.string().optional(),
    engineerId: Joi.string().optional(),
    projectId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  });

  return schema.validate(data);
};