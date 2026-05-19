import { AxiosError } from 'axios';
import type {
  BulkValidationErrorResponse,
  JobValidationError,
} from '@type/admin/error';

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

function isJobValidationError(value: unknown): value is JobValidationError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.field === 'string' &&
    typeof v.message === 'string' &&
    typeof v.code === 'string'
  );
}

// 백엔드의 BulkValidationException(HTTP 400) 응답을 axios 에러에서 안전하게 추출.
// 응답 스키마: { code: 'VALIDATION_ERROR', message, jobId, errors: [{ field, value, code, message }] }
export function extractBulkValidationError(
  error: unknown,
): BulkValidationErrorResponse | null {
  if (!isAxiosError(error)) return null;
  if (error.response?.status !== 400) return null;

  const data = error.response.data as unknown;
  if (typeof data !== 'object' || data === null) return null;

  const obj = data as Record<string, unknown>;
  if (obj.code !== 'VALIDATION_ERROR') return null;
  if (!Array.isArray(obj.errors)) return null;
  if (!obj.errors.every(isJobValidationError)) return null;

  return {
    code: 'VALIDATION_ERROR',
    message: typeof obj.message === 'string' ? obj.message : '',
    jobId: typeof obj.jobId === 'number' ? obj.jobId : -1,
    errors: obj.errors,
  };
}
