import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';

const makeAxiosError = (status: number, data: unknown) => ({
  isAxiosError: true,
  response: { status, data },
});

const validErrorItem = {
  field: 'title',
  message: '제목은 필수입니다',
  code: 'REQUIRED',
};

const validResponse = {
  code: 'VALIDATION_ERROR',
  message: '검증 실패',
  jobId: 42,
  errors: [validErrorItem],
};

describe('extractBulkValidationError', () => {
  test('EX1: non-axios 에러 → null', () => {
    expect(extractBulkValidationError(new Error('fail'))).toBeNull();
    expect(extractBulkValidationError('string error')).toBeNull();
    expect(extractBulkValidationError(null)).toBeNull();
  });

  test('EX2: axios지만 status 500 → null', () => {
    expect(
      extractBulkValidationError(makeAxiosError(500, validResponse)),
    ).toBeNull();
  });

  test('EX3: 400 + response.data null → null', () => {
    expect(extractBulkValidationError(makeAxiosError(400, null))).toBeNull();
  });

  test('EX4: 400 + data.code !== VALIDATION_ERROR → null', () => {
    expect(
      extractBulkValidationError(
        makeAxiosError(400, { ...validResponse, code: 'OTHER_ERROR' }),
      ),
    ).toBeNull();
  });

  test('EX5: errors가 배열 아님 → null', () => {
    expect(
      extractBulkValidationError(
        makeAxiosError(400, { ...validResponse, errors: 'not array' }),
      ),
    ).toBeNull();
  });

  test('EX6: errors 중 한 항목이 field/message/code 누락 → null', () => {
    expect(
      extractBulkValidationError(
        makeAxiosError(400, {
          ...validResponse,
          errors: [validErrorItem, { field: 'rating' }],
        }),
      ),
    ).toBeNull();
  });

  test('EX7: 정상 → 객체 반환 + 필드 일치', () => {
    const result = extractBulkValidationError(
      makeAxiosError(400, validResponse),
    );
    expect(result).toEqual({
      code: 'VALIDATION_ERROR',
      message: '검증 실패',
      jobId: 42,
      errors: [validErrorItem],
    });
  });

  test('EX8: message 누락 → 빈 문자열 fallback', () => {
    const result = extractBulkValidationError(
      makeAxiosError(400, {
        code: 'VALIDATION_ERROR',
        jobId: 42,
        errors: [validErrorItem],
      }),
    );
    expect(result?.message).toBe('');
  });

  test('EX9: jobId가 number 아님 → -1 fallback', () => {
    const result = extractBulkValidationError(
      makeAxiosError(400, {
        code: 'VALIDATION_ERROR',
        message: 'x',
        jobId: 'not-a-number',
        errors: [validErrorItem],
      }),
    );
    expect(result?.jobId).toBe(-1);
  });
});
