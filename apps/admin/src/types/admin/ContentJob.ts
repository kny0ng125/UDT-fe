import type { Category, PlatformInfo } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';

// 백엔드 StreamingStatus 와 1:1
export type ContentJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'INVALID'
  | 'RETRYING';

// GET /api/admin/content-jobs 의 type 파라미터 (백엔드 StreamingFilterType)
export type ContentJobFilterType = 'PENDING' | 'FAILED' | 'INVALID';

// 목록 조회 SQL 이 등록/수정/삭제 3개 테이블만 합치므로 FEEDBACK 은 오지 않는다.
export type ContentJobType = 'REGISTER' | 'UPDATE' | 'DELETE';

// 백엔드 AdminScheduledContentResponse
// 시각은 LocalDateTime 직렬화 문자열(예: '2026-05-14T10:22:30.123').
// id 는 작업 종류별 테이블의 PK 라서 종류가 다르면 같은 숫자가 나올 수 있다 → 식별은 jobType+id.
export interface ContentJob {
  id: number;
  status: ContentJobStatus;
  memberId: number;
  createdAt: string;
  scheduledAt: string | null;
  finishedAt: string | null;
  jobType: ContentJobType;
}

export interface ContentJobListParams {
  type: ContentJobFilterType;
  cursor: string | null;
  size: number;
}

export interface ContentJobListResponse {
  item: ContentJob[];
  nextCursor: string | null;
  hasNext: boolean;
}

interface ContentJobDetailBase {
  streamingJobMetricId: number | null;
  status: ContentJobStatus;
  errorMessage: string | null;
  validationErrors: JobValidationError[] | null;
  retryCount: number;
  skipCount: number;
}

// 등록/수정 작업 상세 — 제출했던 입력값이 그대로 들어 있다.
// directors/casts 는 이름 없이 ID 만 온다.
export interface ContentUpsertJobDetail extends ContentJobDetailBase {
  contentId?: number | null; // 수정 작업만
  title: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  openDate: string | null;
  runningTime: number;
  episode: number;
  rating: string;
  categories: Category[];
  countries: string[];
  directors: number[];
  casts: number[];
  platforms: PlatformInfo[];
}

export interface ContentDeleteJobDetail extends ContentJobDetailBase {
  contentId: number | null;
}

export type ContentJobDetail = ContentUpsertJobDetail | ContentDeleteJobDetail;
