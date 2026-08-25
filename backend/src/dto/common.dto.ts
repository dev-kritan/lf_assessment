import { z } from 'zod';

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationFailure {
  success: false;
  errors: ValidationErrorDetail[];
  message: string;
  code: string;
  statusCode: number;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface ZodLike<T> {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
}

/**
 * Validates any payload against a Zod schema synchronously.
 * Returns a typed success object or a structured failure with field-level errors.
 */
export function validateDto<T>(schema: ZodLike<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors: ValidationErrorDetail[] = (result.error?.issues || result.error?.errors || []).map((err: any) => ({
      field: err.path && err.path.length > 0 ? err.path.join('.') : 'body',
      message: err.message,
    }));

    return {
      success: false,
      errors: formattedErrors,
      message: formattedErrors.length === 1 ? formattedErrors[0].message : 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export type IdParamDTO = z.infer<typeof idParamSchema>;
