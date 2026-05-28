import { mergeGenreFeedbacks } from '@utils/admin/genres';
import type { GenreFeedback } from '@type/admin/user';

const make = (
  genreType: string,
  likeCount: number,
  dislikeCount: number,
  uninterestedCount: number,
): GenreFeedback =>
  ({
    genreType,
    likeCount,
    dislikeCount,
    uninterestedCount,
  }) as unknown as GenreFeedback;

describe('mergeGenreFeedbacks', () => {
  test('MG1: 빈 배열 → []', () => {
    expect(mergeGenreFeedbacks([])).toEqual([]);
  });

  test('MG2: 단일 항목 → total = 세 카운트 합', () => {
    const result = mergeGenreFeedbacks([make('COMEDY', 3, 1, 2)]);
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(6);
    expect(result[0].genreName).toBe('코미디');
  });

  test('MG3: 같은 genreType 두 개 → 병합 + 합산', () => {
    const result = mergeGenreFeedbacks([
      make('COMEDY', 3, 1, 2),
      make('COMEDY', 5, 2, 1),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].likeCount).toBe(8);
    expect(result[0].dislikeCount).toBe(3);
    expect(result[0].uninterestedCount).toBe(3);
    expect(result[0].total).toBe(14);
  });

  test('MG4: 다른 genreType 두 개 → 각각 유지', () => {
    const result = mergeGenreFeedbacks([
      make('COMEDY', 3, 0, 0),
      make('ACTION', 1, 1, 1),
    ]);
    expect(result).toHaveLength(2);
    const names = result.map((r) => r.genreName).sort();
    expect(names).toEqual(['액션', '코미디']);
  });
});
