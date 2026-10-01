import { CONTENT_CATEGORIES, RATING_OPTIONS } from '@constants/index';
import { getGenresByCategory } from '@udt/shared/constants/genres';
import { PLATFORMS } from '@udt/shared/constants/platforms';
import type { Cast, Director } from '@type/admin/Content';

// 시트 한 행. 모든 칸을 문자열로 들고 있어서, 붙여넣은 값 그대로 보여주고 고칠 수 있다.
export interface SheetRow {
  id: number;
  title: string;
  category: string;
  genres: string; // 쉼표로 구분
  rating: string;
  runningTime: string;
  episode: string;
  openDate: string; // YYYY-MM-DD
  platforms: string; // 쉼표로 구분. 시청 주소가 있으면 "넷플릭스=https://..." 형식
  directors: string; // 이름, 쉼표로 구분
  casts: string; // 이름, 쉼표로 구분
}

export type SheetColumn = Exclude<keyof SheetRow, 'id'>;

export const SHEET_COLUMNS: {
  key: SheetColumn;
  label: string;
  width: string;
  placeholder?: string;
}[] = [
  { key: 'title', label: '제목', width: 'w-48' },
  { key: 'category', label: '분류', width: 'w-28', placeholder: '영화' },
  { key: 'genres', label: '장르', width: 'w-40', placeholder: '액션, 범죄' },
  {
    key: 'rating',
    label: '등급',
    width: 'w-40',
    placeholder: '15세 이상 관람가',
  },
  {
    key: 'runningTime',
    label: '러닝타임(분)',
    width: 'w-28',
    placeholder: '0',
  },
  { key: 'episode', label: '회차', width: 'w-20', placeholder: '0' },
  {
    key: 'openDate',
    label: '개봉일',
    width: 'w-32',
    placeholder: '2024-01-31',
  },
  {
    key: 'platforms',
    label: '플랫폼',
    width: 'w-48',
    placeholder: '넷플릭스=https://...',
  },
  { key: 'directors', label: '감독', width: 'w-36' },
  { key: 'casts', label: '출연진', width: 'w-44' },
];

export const createEmptyRow = (id: number): SheetRow => ({
  id,
  title: '',
  category: '',
  genres: '',
  rating: '',
  runningTime: '',
  episode: '',
  openDate: '',
  platforms: '',
  directors: '',
  casts: '',
});

// ---- 파일/붙여넣기 → 행 변환 -------------------------------------------------

// 헤더 이름(여러 표기)을 시트 열로 연결한다. 공백·대소문자·괄호 내용은 무시하고 비교한다.
const HEADER_ALIASES: Record<SheetColumn, string[]> = {
  title: ['제목', '작품명', '콘텐츠명', '타이틀', 'title', 'name'],
  category: ['분류', '카테고리', '유형', '종류', 'category', 'type'],
  genres: ['장르', 'genre', 'genres'],
  rating: ['등급', '관람등급', '시청등급', 'rating'],
  runningTime: ['러닝타임', '상영시간', '재생시간', 'runningtime', 'runtime'],
  episode: ['회차', '에피소드', '총회차', '화수', 'episode', 'episodes'],
  openDate: [
    '개봉일',
    '공개일',
    '방영일',
    '개봉',
    '출시일',
    'opendate',
    'date',
  ],
  platforms: ['플랫폼', 'ott', '시청처', '서비스', 'platform', 'platforms'],
  directors: ['감독', '연출', 'director', 'directors'],
  casts: ['출연진', '출연', '배우', '주연', 'cast', 'casts', 'actors'],
};

const headerKey = (value: string) =>
  value
    .replace(/\(.*?\)/g, '')
    .replace(/[\s_\-]/g, '')
    .toLowerCase();

const matchHeader = (value: string): SheetColumn | null => {
  const key = headerKey(value);
  if (!key) return null;
  for (const col of Object.keys(HEADER_ALIASES) as SheetColumn[]) {
    if (HEADER_ALIASES[col].some((alias) => headerKey(alias) === key)) {
      return col;
    }
  }
  return null;
};

// CSV/TSV 텍스트를 칸 배열로. 따옴표로 감싼 칸(쉼표·줄바꿈 포함)을 지원하고,
// 구분자는 첫 줄을 보고 탭/쉼표/세미콜론 중에서 고른다.
export function parseDelimited(text: string): string[][] {
  const source = text.replace(/^﻿/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = ['\t', ',', ';']
    .map((d) => ({ d, n: firstLine.split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;

  const table: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      table.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  table.push(row);

  return table
    .map((r) => r.map((v) => v.trim()))
    .filter((r) => r.some((v) => v !== ''));
}

// ---- 값 자동 정리 -----------------------------------------------------------

const CATEGORY_ALIASES: Record<string, string> = {
  movie: '영화',
  film: '영화',
  영화: '영화',
  drama: '드라마',
  tv드라마: '드라마',
  드라마: '드라마',
  animation: '애니메이션',
  anime: '애니메이션',
  애니: '애니메이션',
  애니메이션: '애니메이션',
  variety: '예능',
  예능: '예능',
  예능프로그램: '예능',
};

const PLATFORM_ALIASES: Record<string, string> = {
  netflix: '넷플릭스',
  넷플릭스: '넷플릭스',
  tving: '티빙',
  티빙: '티빙',
  coupangplay: '쿠팡플레이',
  coupang: '쿠팡플레이',
  쿠팡플레이: '쿠팡플레이',
  쿠팡: '쿠팡플레이',
  wavve: '웨이브',
  웨이브: '웨이브',
  disney: '디즈니+',
  disneyplus: '디즈니+',
  'disney+': '디즈니+',
  디즈니플러스: '디즈니+',
  디즈니: '디즈니+',
  '디즈니+': '디즈니+',
  watcha: '왓챠',
  왓챠: '왓챠',
};

const GENRE_ALIASES: Record<string, string> = {
  sf: 'SF',
  로맨스: '멜로/로맨스',
  멜로: '멜로/로맨스',
  드라마: '서사/드라마',
  공포: '공포(호러)',
  호러: '공포(호러)',
  시대극: '사극/시대극',
  사극: '사극/시대극',
  다큐: '다큐멘터리',
  스탠드업: '스탠드업코미디',
};

const normalizeRating = (value: string): string => {
  const v = value.replace(/\s/g, '');
  if (!v) return '';
  if (v.includes('전체') || v.toLowerCase() === 'all') return '전체 관람가';
  if (v.startsWith('12')) return '12세 이상 관람가';
  if (v.startsWith('15')) return '15세 이상 관람가';
  if (/청소년|청불|^(18|19)/.test(v)) return '청소년 관람불가';
  return value.trim();
};

const normalizeNumber = (value: string): string => {
  const m = value.trim().match(/^(\d+)\s*(분|회|화|부작|편)?$/);
  return m ? m[1] : value.trim();
};

const normalizeDate = (value: string): string => {
  const v = value.trim();
  if (!v) return '';
  const pad = (n: string) => n.padStart(2, '0');
  const m = v.match(
    /^(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?$/,
  );
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  const compact = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return v;
};

// 시트 한 행의 값을 서버가 받는 표기로 최대한 맞춘다. 맞출 수 없는 값은 그대로 둔다
// (검증 단계에서 어떤 칸이 왜 틀렸는지 알려준다).
export function normalizeRow(row: SheetRow): SheetRow {
  const categoryKey = row.category.replace(/\s/g, '').toLowerCase();
  const category = CATEGORY_ALIASES[categoryKey] ?? row.category.trim();

  const allowed = getGenresByCategory(category);
  const genres = splitList(row.genres)
    .map((g) => {
      if (allowed.includes(g)) return g;
      const alias = GENRE_ALIASES[g.replace(/\s/g, '').toLowerCase()];
      return alias && (allowed.length === 0 || allowed.includes(alias))
        ? alias
        : g;
    })
    .join(', ');

  const platforms = parsePlatforms(row.platforms)
    .map((p) => {
      const name =
        PLATFORM_ALIASES[p.platformType.replace(/\s/g, '').toLowerCase()] ??
        p.platformType;
      return p.watchUrl ? `${name}=${p.watchUrl}` : name;
    })
    .join(', ');

  return {
    ...row,
    title: row.title.trim(),
    category,
    genres,
    rating: normalizeRating(row.rating),
    runningTime: normalizeNumber(row.runningTime),
    episode: normalizeNumber(row.episode),
    openDate: normalizeDate(row.openDate),
    platforms,
    directors: splitList(row.directors).join(', '),
    casts: splitList(row.casts).join(', '),
  };
}

export interface ImportResult {
  rows: SheetRow[];
  /** 값을 자동으로 바꾼 칸 수 */
  adjusted: number;
  /** 헤더로 인식하지 못해 무시한 열 이름 */
  ignoredColumns: string[];
}

// CSV/TSV 텍스트 → 행. 첫 줄이 헤더(열 이름 2개 이상 인식)면 이름으로 열을 찾고,
// 아니면 SHEET_COLUMNS 순서로 읽는다.
export function importTable(text: string, startId: number): ImportResult {
  const table = parseDelimited(text);
  if (table.length === 0) return { rows: [], adjusted: 0, ignoredColumns: [] };

  const headerMap = table[0].map(matchHeader);
  const hasHeader = headerMap.filter(Boolean).length >= 2;
  const ignoredColumns = hasHeader
    ? table[0].filter((_, i) => !headerMap[i] && table[0][i] !== '')
    : [];
  const dataRows = hasHeader ? table.slice(1) : table;

  let adjusted = 0;
  const rows = dataRows.map((cells, index) => {
    const raw = createEmptyRow(startId + index);
    if (hasHeader) {
      headerMap.forEach((col, i) => {
        if (col) raw[col] = (cells[i] ?? '').trim();
      });
    } else {
      SHEET_COLUMNS.forEach((col, i) => {
        raw[col.key] = (cells[i] ?? '').trim();
      });
    }
    const normalized = normalizeRow(raw);
    SHEET_COLUMNS.forEach((col) => {
      if (raw[col.key] !== normalized[col.key]) adjusted += 1;
    });
    return normalized;
  });

  return { rows, adjusted, ignoredColumns };
}

// 입력 양식(헤더 + 예시 한 줄). 엑셀에서 한글이 깨지지 않게 BOM을 붙여 내려받는다.
export const TEMPLATE_CSV =
  '﻿' +
  [
    SHEET_COLUMNS.map((c) => c.label).join(','),
    '예시 영화,영화,"액션, 범죄",15세 이상 관람가,120,0,2024-01-31,"넷플릭스=https://www.netflix.com/title/1, 티빙",봉준호,"송강호, 박소담"',
  ].join('\r\n');

export const splitList = (value: string): string[] =>
  value
    .split(/[,，、;；|\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

export interface ParsedPlatform {
  platformType: string;
  watchUrl: string;
}

export const parsePlatforms = (value: string): ParsedPlatform[] =>
  splitList(value).map((item) => {
    const eq = item.indexOf('=');
    if (eq === -1) return { platformType: item, watchUrl: '' };
    return {
      platformType: item.slice(0, eq).trim(),
      watchUrl: item.slice(eq + 1).trim(),
    };
  });

const PLATFORM_LABELS: string[] = PLATFORMS.map((p) => p.label);
const INTEGER = /^\d+$/;

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // 시간대와 무관하게 연/월/일이 그대로 되돌아오는지(2월 30일 같은 값 제외)로 판단한다.
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
};

export type CellErrors = Partial<Record<SheetColumn, string>>;

// 서버를 거치지 않고 알 수 있는 오류만 검사한다(형식, 목록에 있는 값인지).
// 감독/출연진이 실제로 등록돼 있는지는 서버 조회가 필요해서 resolvePeople에서 본다.
export function validateRow(row: SheetRow): CellErrors {
  const errors: CellErrors = {};

  if (!row.title.trim()) errors.title = '제목을 입력해 주세요.';

  const category = row.category.trim();
  const categoryOk = (CONTENT_CATEGORIES as readonly string[]).includes(
    category,
  );
  if (!category) {
    errors.category = '분류를 입력해 주세요.';
  } else if (!categoryOk) {
    errors.category = `영화, 드라마, 애니메이션, 예능 중에서 입력해 주세요.`;
  }

  const genres = splitList(row.genres);
  if (genres.length === 0) {
    errors.genres = '장르를 하나 이상 입력해 주세요.';
  } else if (categoryOk) {
    const allowed = getGenresByCategory(category);
    const bad = genres.filter((g) => !allowed.includes(g));
    if (bad.length > 0) {
      errors.genres = `${category}에서 쓸 수 없는 장르: ${bad.join(', ')}`;
    }
  }

  if (!row.rating.trim()) {
    errors.rating = '등급을 입력해 주세요.';
  } else if (!(RATING_OPTIONS as readonly string[]).includes(row.rating)) {
    errors.rating = `${RATING_OPTIONS.join(' / ')} 중에서 입력해 주세요.`;
  }

  if (row.runningTime.trim() && !INTEGER.test(row.runningTime.trim())) {
    errors.runningTime = '0 이상의 정수로 입력해 주세요.';
  }
  if (row.episode.trim() && !INTEGER.test(row.episode.trim())) {
    errors.episode = '0 이상의 정수로 입력해 주세요.';
  }

  if (row.openDate.trim() && !isValidDate(row.openDate.trim())) {
    errors.openDate = 'YYYY-MM-DD 형식으로 입력해 주세요.';
  }

  const platforms = parsePlatforms(row.platforms);
  if (platforms.length === 0) {
    errors.platforms = '플랫폼을 하나 이상 입력해 주세요.';
  } else {
    const badName = platforms.filter(
      (p) => !PLATFORM_LABELS.includes(p.platformType),
    );
    const badUrl = platforms.filter(
      (p) => p.watchUrl && !/^https?:\/\/\S+$/.test(p.watchUrl),
    );
    if (badName.length > 0) {
      errors.platforms = `지원하지 않는 플랫폼: ${badName
        .map((p) => p.platformType)
        .join(', ')} (${PLATFORM_LABELS.join(', ')})`;
    } else if (badUrl.length > 0) {
      errors.platforms = `시청 주소는 http(s)://로 시작해야 해요: ${badUrl
        .map((p) => p.platformType)
        .join(', ')}`;
    }
  }

  return errors;
}

export type PersonLookup<T> = (name: string) => Promise<T[]>;

export interface ResolvedPeople {
  casts: Cast[];
  directors: Director[];
  errors: CellErrors;
}

// 이름 → 등록된 인물. 정확히 한 명이어야 한다(없거나 동명이인이면 오류로 알려준다).
export async function resolvePeople(
  row: SheetRow,
  findCasts: PersonLookup<Cast>,
  findDirectors: PersonLookup<Director>,
): Promise<ResolvedPeople> {
  const errors: CellErrors = {};
  const casts: Cast[] = [];
  const directors: Director[] = [];

  const castProblems: string[] = [];
  for (const name of splitList(row.casts)) {
    const matches = (await findCasts(name)).filter((c) => c.castName === name);
    if (matches.length === 0) castProblems.push(`"${name}" 미등록`);
    else if (matches.length > 1)
      castProblems.push(`"${name}" 동명이인 ${matches.length}명`);
    else if (!casts.some((c) => c.castId === matches[0].castId))
      casts.push(matches[0]);
  }
  if (castProblems.length > 0) {
    errors.casts = `${castProblems.join(', ')} — 인물 등록 후 다시 시도해 주세요.`;
  }

  const directorProblems: string[] = [];
  for (const name of splitList(row.directors)) {
    const matches = (await findDirectors(name)).filter(
      (d) => d.directorName === name,
    );
    if (matches.length === 0) directorProblems.push(`"${name}" 미등록`);
    else if (matches.length > 1)
      directorProblems.push(`"${name}" 동명이인 ${matches.length}명`);
    else if (!directors.some((d) => d.directorId === matches[0].directorId))
      directors.push(matches[0]);
  }
  if (directorProblems.length > 0) {
    errors.directors = `${directorProblems.join(', ')} — 인물 등록 후 다시 시도해 주세요.`;
  }

  return { casts, directors, errors };
}

// 검증을 통과한 행을 등록 API 요청 본문으로 바꾼다. ContentForm의 저장 형식과 같다.
export function toRegisterRequest(
  row: SheetRow,
  casts: Cast[],
  directors: Director[],
) {
  const openDate = row.openDate.trim();
  return {
    title: row.title.trim(),
    description: '',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    openDate: openDate ? `${openDate}T00:00:00` : '',
    runningTime: Number(row.runningTime.trim() || 0),
    episode: Number(row.episode.trim() || 0),
    rating: row.rating,
    categories: [
      { categoryType: row.category.trim(), genres: splitList(row.genres) },
    ],
    countries: [] as string[],
    directors: directors.map((d) => d.directorId),
    casts: casts.map((c) => c.castId),
    platforms: parsePlatforms(row.platforms),
  };
}

// 서버가 돌려준 오류 field를 시트의 칸으로 옮긴다.
export function fieldToColumn(field: string): SheetColumn | null {
  if (/^casts\[/.test(field)) return 'casts';
  if (/^directors\[/.test(field)) return 'directors';
  if (/^platforms\[/.test(field)) return 'platforms';
  if (/^categories\[\d+\]\.genres/.test(field)) return 'genres';
  if (/^categories\[/.test(field)) return 'category';
  const direct: Record<string, SheetColumn> = {
    title: 'title',
    rating: 'rating',
    runningTime: 'runningTime',
    episode: 'episode',
    openDate: 'openDate',
  };
  return direct[field] ?? null;
}
