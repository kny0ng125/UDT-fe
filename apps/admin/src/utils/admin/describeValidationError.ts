import type { Category, Cast, Director } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';

export interface ValidationMessage {
  /** 무엇이 틀렸는지 (예: 출연진 "홍길동") */
  target: string;
  /** 왜 틀렸고 어떻게 고치면 되는지 */
  reason: string;
}

// 이름을 찾는 데 쓰는, 사용자가 폼에 입력해 둔 값. 없어도 동작한다.
interface FormLookup {
  casts?: Cast[];
  directors?: Director[];
  categories?: Category[];
}

const quote = (value: string) => `"${value}"`;

// 재제출 화면은 이름 대신 "ID 123"을 이름 자리에 넣어 두므로, 그런 값은 이름으로 치지 않는다.
const isRealName = (name: string | undefined): name is string =>
  !!name && !/^ID \d+$/.test(name);

// 오류 필드 경로 → 폼에서 이동할 요소 id. 없으면 null(바로가기 아이콘을 보여주지 않는다).
export function getErrorAnchorId(field: string): string | null {
  if (/^casts\[/.test(field)) return 'form-section-cast';
  if (/^directors\[/.test(field)) return 'form-section-director';
  if (/^platforms\[/.test(field)) return 'form-section-platform';
  if (/^categories\[\d+\]\.genres/.test(field)) return 'form-genres';
  if (/^categories\[/.test(field)) return 'category';
  if (/^countries/.test(field)) return 'form-countries';
  const direct: Record<string, string> = {
    title: 'title',
    rating: 'rating',
    description: 'description',
    posterUrl: 'form-section-basic',
    backdropUrl: 'form-section-basic',
    trailerUrl: 'trailerUrl',
    openDate: 'openDate',
    runningTime: 'runningTime',
    episode: 'episode',
  };
  return direct[field] ?? null;
}

/**
 * 서버 검증 오류(field 경로·코드·원문 메시지)를, 사용자가 입력한 값 기준으로
 * "무엇이 / 왜 틀렸는지"를 알려주는 문장으로 바꾼다.
 * field 경로(casts[0] 등)와 오류 코드는 화면에 노출하지 않는다.
 */
export function describeValidationError(
  error: JobValidationError,
  form: FormLookup = {},
): ValidationMessage {
  const { field, value, code } = error;

  // 출연진: 값은 castId. 폼에 남아 있으면 이름으로 보여준다.
  if (/^casts\[\d+\]/.test(field)) {
    const name = form.casts?.find((c) => String(c.castId) === value)?.castName;
    return {
      target: isRealName(name)
        ? `출연진 ${quote(name)}`
        : `출연진 (ID ${value})`,
      reason:
        '존재하지 않거나 삭제된 출연진이에요. 목록에서 지우고 다시 검색해서 추가해 주세요.',
    };
  }

  if (/^directors\[\d+\]/.test(field)) {
    const name = form.directors?.find(
      (d) => String(d.directorId) === value,
    )?.directorName;
    return {
      target: isRealName(name) ? `감독 ${quote(name)}` : `감독 (ID ${value})`,
      reason:
        '존재하지 않거나 삭제된 감독이에요. 목록에서 지우고 다시 검색해서 추가해 주세요.',
    };
  }

  if (/^categories\[\d+\]\.categoryType/.test(field)) {
    return {
      target: `분류 ${quote(value)}`,
      reason:
        '올바른 분류가 아니에요. 영화, 드라마, 애니메이션, 예능 중에서 선택해 주세요.',
    };
  }

  const genreMatch = field.match(/^categories\[(\d+)\]\.genres\[\d+\]/);
  if (genreMatch) {
    const category = form.categories?.[Number(genreMatch[1])]?.categoryType;
    const where = category ? `${quote(category)} 분류` : '선택한 분류';
    return {
      target: `장르 ${quote(value)}`,
      reason:
        code === 'GENRE_TYPE_BAD_REQUEST'
          ? '올바른 장르가 아니에요. 목록에서 다시 선택해 주세요.'
          : `${where}에서는 사용할 수 없는 장르예요. 장르를 다시 선택해 주세요.`,
    };
  }

  if (/^platforms\[\d+\]/.test(field)) {
    return {
      target: `플랫폼 ${quote(value)}`,
      reason: '지원하지 않는 플랫폼이에요. 목록에서 다시 선택해 주세요.',
    };
  }

  if (field === 'contentId') {
    return {
      target: `콘텐츠 ID ${value}`,
      reason:
        '존재하지 않거나 이미 삭제된 콘텐츠예요. ID를 다시 확인해 주세요.',
    };
  }

  // 알 수 없는 필드는 서버가 준 문장을 그대로 보여준다.
  return {
    target: value ? `입력값 ${quote(value)}` : '입력값',
    reason: error.message,
  };
}
