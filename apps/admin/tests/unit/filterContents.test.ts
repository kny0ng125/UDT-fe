import { filterContents } from '@utils/getContentUtils';
import type { ContentSummary } from '@type/admin/Content';

const make = (title: string, category: string): ContentSummary =>
  ({ title, categories: [category] }) as unknown as ContentSummary;

const items = [
  make('Inception', '영화'),
  make('Friends', '드라마'),
  make('inside out', '애니메이션'),
  make('John Wick', '영화'),
];

describe('filterContents', () => {
  test('FC1: 빈 검색어 + all → 전부', () => {
    expect(filterContents(items, '', 'all')).toHaveLength(4);
  });

  test('FC2: 대소문자 무시 부분 일치', () => {
    const result = filterContents(items, 'IN', 'all');
    const titles = result.map((c) => c.title).sort();
    expect(titles).toEqual(['Inception', 'inside out']);
  });

  test('FC3: filterType 특정 → 해당 카테고리만', () => {
    const result = filterContents(items, '', '영화');
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.categories[0] === '영화')).toBe(true);
  });

  test('FC4: 검색 + 타입 둘 다 → AND', () => {
    const result = filterContents(items, 'in', '영화');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Inception');
  });

  test('FC5: 매칭 없음 → []', () => {
    expect(filterContents(items, 'zzz', 'all')).toEqual([]);
  });
});
