import { createFilterRequestParam } from '../../utils/createFilterRequestParam';

describe('createFilterRequestParam', () => {
  it('should classify category filters correctly', () => {
    const result = createFilterRequestParam(['영화', '드라마']);
    expect(result.categories).toEqual(['영화', '드라마']);
  });

  it('should classify platform filters correctly', () => {
    const result = createFilterRequestParam(['넷플릭스', '티빙']);
    expect(result.platforms).toEqual(['넷플릭스', '티빙']);
  });

  it('should classify country filters correctly', () => {
    const result = createFilterRequestParam(['한국', '미국']);
    expect(result.countries).toEqual(['한국', '미국']);
  });

  it('should classify rating filters correctly', () => {
    const result = createFilterRequestParam(['15세 이상 관람가']);
    expect(result.ratings).toEqual(['15세 이상 관람가']);
  });

  it('should classify genre filters correctly', () => {
    const result = createFilterRequestParam(['액션', 'SF']);
    expect(result.genres).toEqual(['액션', 'SF']);
  });

  it('should parse year filters to ISO date strings', () => {
    const result = createFilterRequestParam(['2024년']);
    expect(result.openDates).toEqual(['2024-01-01T00:00:00.000Z']);
  });

  it('should handle mixed filters', () => {
    const result = createFilterRequestParam([
      '영화',
      '넷플릭스',
      '한국',
      '2020년',
      '액션',
    ]);
    expect(result.categories).toEqual(['영화']);
    expect(result.platforms).toEqual(['넷플릭스']);
    expect(result.countries).toEqual(['한국']);
    expect(result.openDates).toEqual(['2020-01-01T00:00:00.000Z']);
    expect(result.genres).toEqual(['액션']);
  });

  it('should omit empty arrays from result', () => {
    const result = createFilterRequestParam(['영화']);
    expect(result).toEqual({ categories: ['영화'] });
    expect(result.platforms).toBeUndefined();
  });

  it('should return empty-like object for empty input', () => {
    const result = createFilterRequestParam([]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should ignore unrecognized filter values', () => {
    const result = createFilterRequestParam(['알수없는필터']);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
