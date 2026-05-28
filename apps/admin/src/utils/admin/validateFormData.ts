import type { ContentWithoutId } from '@type/admin/Content';

export const validateFormData = (formData: ContentWithoutId): string | null => {
  // 제목 검증
  if (!formData.title.trim()) return '제목은 필수 항목입니다.';

  // 관람등급 검증
  if (!formData.rating || formData.rating.trim() === '') {
    return '관람등급은 필수 항목입니다.';
  }

  // 카테고리 검증
  if (
    !formData.categories[0]?.categoryType ||
    formData.categories[0].categoryType.trim() === ''
  ) {
    return '카테고리는 필수 항목입니다.';
  }

  // 장르 검증 (하나 이상 선택되어야 함)
  if (
    !formData.categories[0]?.genres ||
    formData.categories[0].genres.length === 0
  ) {
    return '장르는 하나 이상 선택해야 합니다.';
  }

  // 플랫폼 검증 (하나 이상 선택되어야 함)
  if (!formData.platforms || formData.platforms.length === 0) {
    return '플랫폼은 하나 이상 입력해야 합니다.';
  }

  return null;
};
