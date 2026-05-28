import { generateChartData } from '@utils/getContentUtils';
import type { ContentSummary } from '@type/admin/Content';

const make = (category?: string): ContentSummary =>
  ({ categories: category ? [category] : [] }) as unknown as ContentSummary;

describe('generateChartData', () => {
  test('GC1: 빈 배열 → []', () => {
    expect(generateChartData([])).toEqual([]);
  });

  test('GC2: 같은 카테고리 3개 → count 3', () => {
    const result = generateChartData([
      make('영화'),
      make('영화'),
      make('영화'),
    ]);
    expect(result).toEqual([{ name: '영화', count: 3 }]);
  });

  test('GC3: 다른 카테고리 2개 → 각각 1', () => {
    const result = generateChartData([make('영화'), make('드라마')]);
    expect(result).toEqual([
      { name: '영화', count: 1 },
      { name: '드라마', count: 1 },
    ]);
  });

  test('GC4: categories[0] 없으면 "기타"로 카운트', () => {
    const result = generateChartData([make(), make()]);
    expect(result).toEqual([{ name: '기타', count: 2 }]);
  });
});
