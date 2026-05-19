export interface JobValidationError {
  field: string;
  value: string;
  code: string;
  message: string;
}

export interface BulkValidationErrorResponse {
  code: 'VALIDATION_ERROR';
  message: string;
  jobId: number;
  errors: JobValidationError[];
}
