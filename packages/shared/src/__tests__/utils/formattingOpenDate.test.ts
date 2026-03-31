import { formattingOpenDate } from '../../utils/formattingOpenDate';

describe('formattingOpenDate', () => {
  it('should format a valid ISO date string to YYYY-MM-DD', () => {
    expect(formattingOpenDate('2024-03-15T00:00:00.000Z')).toBe('2024-03-15');
  });

  it('should format a date-only string', () => {
    expect(formattingOpenDate('2023-01-01')).toBe('2023-01-01');
  });

  it('should pad single-digit month and day', () => {
    expect(formattingOpenDate('2024-01-05T00:00:00.000Z')).toBe('2024-01-05');
  });

  it('should return fallback for undefined', () => {
    expect(formattingOpenDate(undefined)).toBe('개봉일 정보 없음');
  });

  it('should return fallback for null', () => {
    expect(formattingOpenDate(null)).toBe('개봉일 정보 없음');
  });

  it('should return fallback for empty string', () => {
    expect(formattingOpenDate('')).toBe('개봉일 정보 없음');
  });

  it('should return fallback for invalid date string', () => {
    expect(formattingOpenDate('not-a-date')).toBe('개봉일 정보 없음');
  });
});
