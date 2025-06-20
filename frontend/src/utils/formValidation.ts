export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  custom?: (value: T) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateField = <T>(
  value: T,
  fieldName: string,
  rules: ValidationRule<T>
): string | null => {
  // Required validation
  if (rules.required) {
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return `${fieldName} is required`;
    }
  }

  // Skip other validations if value is empty and not required
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Email validation
  if (rules.email && typeof value === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  // String length validation
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }
  }

  // Number validation
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `${fieldName} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${fieldName} must be no more than ${rules.max}`;
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string') {
    if (!rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  rules: { [K in keyof T]?: ValidationRule<T[K]> }
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName], fieldName, fieldRules);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation rules
export const commonRules = {
  email: { required: true, email: true },
  password: { required: true, minLength: 6 },
  name: { required: true, minLength: 2, maxLength: 100 },
  description: { required: true, minLength: 10, maxLength: 1000 },
  percentage: { required: true, min: 1, max: 100 },
  positiveNumber: { required: true, min: 0 },
  capacity: { required: true, min: 1, max: 100 },
  department: { required: true, minLength: 2, maxLength: 50 },
  requiredArray: { 
    required: true, 
    custom: (value: unknown) => Array.isArray(value) && value.length > 0 ? null : 'At least one item is required'
  },
  skills: {
    required: true,
    custom: (value: unknown) => {
      if (!Array.isArray(value)) return 'Skills must be an array';
      if (value.length === 0) return 'At least one skill is required';
      return null;
    }
  }
};