export interface FormValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
  firstError?: string;
}

export interface ZodLikeSchema<T> {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
}

/**
 * Validates form data against a Zod schema and extracts a field-by-field error map
 * and the primary first error message.
 */
export function validateForm<T>(schema: ZodLikeSchema<T>, formData: unknown): FormValidationResult<T> {
  const result = schema.safeParse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    let firstError: string | undefined;

    const issues = result.error?.issues || result.error?.errors || [];
    issues.forEach((err: any) => {
      const field = err.path && err.path.length > 0 ? err.path.join('.') : 'root';
      if (!errors[field]) {
        errors[field] = err.message;
      }
      if (!firstError) {
        firstError = err.message;
      }
    });

    return {
      isValid: false,
      errors,
      firstError: firstError || 'Validation failed',
    };
  }

  return {
    isValid: true,
    data: result.data,
    errors: {},
  };
}

/**
 * Maps backend API error details into field-by-field errors.
 */
export function mapApiErrors(apiError: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (apiError && Array.isArray(apiError.details)) {
    apiError.details.forEach((item: { field?: string; message?: string }) => {
      if (item.field && item.message) {
        fieldErrors[item.field] = item.message;
      }
    });
  }
  return fieldErrors;
}
