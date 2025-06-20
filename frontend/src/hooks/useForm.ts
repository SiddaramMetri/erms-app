import { useState, useCallback } from 'react';
import { validateForm, type ValidationRule } from '@/utils/formValidation';

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Record<keyof T, ValidationRule>;
  onSubmit: (values: T) => Promise<void>;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isLoading: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  clearErrors: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  validate: () => boolean;
}

export const useForm = <T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    if (!validationRules) return true;

    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(values);
    } catch (error: unknown) {
      setError('submit', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [validate, onSubmit, values, setError]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setIsLoading(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    isLoading,
    isValid,
    setValue,
    setValues,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    validate,
  };
};