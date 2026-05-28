import { validateFormData } from '@utils/admin/validateFormData';
import type { ContentWithoutId } from '@type/admin/Content';

const validForm: ContentWithoutId = {
  title: 'Inception',
  description: 'desc',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: '',
  openDate: '',
  runningTime: 120,
  episode: 0,
  rating: 'PG-13',
  categories: [{ categoryType: '영화', genres: ['ACTION'] }],
  countries: [],
  directors: [],
  casts: [],
  platforms: [{ platformType: 'NETFLIX', watchUrl: 'https://x' }],
} as unknown as ContentWithoutId;

describe('validateFormData', () => {
  test('VF1: title 공백만 → 제목 메시지', () => {
    expect(validateFormData({ ...validForm, title: '   ' })).toBe(
      '제목은 필수 항목입니다.',
    );
  });

  test('VF2: rating 빈 → 관람등급 메시지', () => {
    expect(validateFormData({ ...validForm, rating: '' })).toBe(
      '관람등급은 필수 항목입니다.',
    );
  });

  test('VF3: categoryType 공백 → 카테고리 메시지', () => {
    expect(
      validateFormData({
        ...validForm,
        categories: [{ categoryType: '  ', genres: ['ACTION'] }],
      }),
    ).toBe('카테고리는 필수 항목입니다.');
  });

  test('VF4: genres 빈 → 장르 메시지', () => {
    expect(
      validateFormData({
        ...validForm,
        categories: [{ categoryType: '영화', genres: [] }],
      }),
    ).toBe('장르는 하나 이상 선택해야 합니다.');
  });

  test('VF5: platforms 빈 → 플랫폼 메시지', () => {
    expect(validateFormData({ ...validForm, platforms: [] })).toBe(
      '플랫폼은 하나 이상 입력해야 합니다.',
    );
  });

  test('VF6: 모두 OK → null', () => {
    expect(validateFormData(validForm)).toBeNull();
  });
});
