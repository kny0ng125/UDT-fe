import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ContentCreateUpdate } from '@type/admin/Content';
import type {
  ContentDeleteJobDetail,
  ContentJob,
  ContentJobDetail,
  ContentJobFilterType,
  ContentJobType,
  ContentUpsertJobDetail,
} from '@type/admin/ContentJob';
import type { JobValidationError } from '@type/admin/error';

// 요청 모니터를 서버 없이 보기 위한 가짜 응답.
// 백엔드 규칙을 따른다:
//  - 목록은 PENDING/FAILED/INVALID 만 조회된다.
//  - 재제출은 INVALID 만, 재시도는 FAILED 만 가능하다(아니면 409).
//  - 재제출이 다시 검증에 실패하면 400 VALIDATION_ERROR 와 함께 같은 작업이 INVALID 로 갱신된다.
// 아래 "마커" 값이 입력에 남아 있으면 검증에 실패하고, 지우면 통과한다.

export const MOCK_RULES = [
  "장르 '없는장르' / 분류 '없는분류' / 플랫폼 '없는플랫폼' → 재제출 시 다시 검증 실패",
  '출연진 ID 999999 · 감독 ID 888888 · 삭제 콘텐츠 ID 777777 → 존재하지 않음',
  '#103 재시도 → 성공하고 목록에서 사라짐 / #202 재시도 → 서버가 또 실패(재시도 횟수 증가, 3회가 되면 한도 초과 409)',
] as const;

const BAD_GENRE = '없는장르';
const BAD_CATEGORY = '없는분류';
const BAD_PLATFORM = '없는플랫폼';
const BAD_CAST_ID = 999999;
const BAD_DIRECTOR_ID = 888888;
const BAD_CONTENT_ID = 777777;
const RETRY_LIMIT = 3; // 백엔드 AdminTriggerService.MAX_RETRY_COUNT

interface MockJob {
  meta: ContentJob;
  detail: ContentJobDetail;
}

const pad = (n: number) => String(n).padStart(2, '0');
// 백엔드 LocalDateTime 직렬화 형식(시간대 없음)
const at = (minutesFromNow: number): string => {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`;
};

const err = (
  field: string,
  value: string,
  code: string,
  message: string,
): JobValidationError => ({ field, value, code, message });

const genreErr = (i: number, j: number, value: string) =>
  err(
    `categories[${i}].genres[${j}]`,
    value,
    'GENRE_TYPE_BAD_REQUEST',
    '올바르지 않은 장르 타입입니다.',
  );
const platformErr = (i: number, value: string) =>
  err(
    `platforms[${i}].platformType`,
    value,
    'PLATFORM_TYPE_BAD_REQUEST',
    '올바르지 않은 플랫폼 타입입니다.',
  );
const castErr = (i: number, id: number) =>
  err(
    `casts[${i}]`,
    String(id),
    'CAST_NOT_FOUND',
    '출연진을 찾을 수 없습니다.',
  );
const directorErr = (i: number, id: number) =>
  err(
    `directors[${i}]`,
    String(id),
    'DIRECTOR_NOT_FOUND',
    '감독을 찾을 수 없습니다.',
  );
const contentErr = (id: number) =>
  err(
    'contentId',
    String(id),
    'CONTENT_NOT_FOUND',
    '콘텐츠를 찾을 수 없습니다.',
  );

const upsert = (
  title: string,
  extra: Partial<ContentUpsertJobDetail>,
): ContentUpsertJobDetail => ({
  streamingJobMetricId: null,
  status: 'INVALID',
  errorMessage: null,
  validationErrors: null,
  retryCount: 0,
  skipCount: 0,
  title,
  description: '',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: '',
  openDate: '2025-01-01T00:00:00',
  runningTime: 120,
  episode: 0,
  rating: '15세 이상 관람가',
  categories: [{ categoryType: '영화', genres: ['액션'] }],
  countries: ['한국'],
  directors: [],
  casts: [],
  platforms: [{ platformType: '넷플릭스', watchUrl: 'https://example.com' }],
  ...extra,
});

const makeMeta = (
  id: number,
  jobType: ContentJobType,
  status: ContentJob['status'],
  minutesAgo: number,
  memberId = 1,
): ContentJob => ({
  id,
  status,
  memberId,
  createdAt: at(-minutesAgo),
  scheduledAt: status === 'PENDING' ? at(30) : null,
  finishedAt: status === 'PENDING' ? null : at(-minutesAgo + 0.1),
  jobType,
});

const createMockJobs = (): MockJob[] => {
  // INVALID 4건: 서로 다른 오류 조합
  const reg101Errors = [
    genreErr(0, 1, BAD_GENRE),
    platformErr(0, BAD_PLATFORM),
    castErr(0, BAD_CAST_ID),
  ];
  const reg102Errors = [directorErr(0, BAD_DIRECTOR_ID)];
  const up201Errors = [genreErr(0, 0, BAD_GENRE)];
  const del301Errors = [contentErr(BAD_CONTENT_ID)];

  return [
    {
      meta: makeMeta(101, 'REGISTER', 'INVALID', 4),
      detail: upsert('파묘', {
        categories: [{ categoryType: '영화', genres: ['액션', BAD_GENRE] }],
        platforms: [{ platformType: BAD_PLATFORM, watchUrl: 'https://x.com' }],
        casts: [BAD_CAST_ID],
        validationErrors: reg101Errors,
      }),
    },
    {
      meta: makeMeta(102, 'REGISTER', 'INVALID', 12, 2),
      detail: upsert('눈물의 여왕', {
        categories: [{ categoryType: '드라마', genres: ['서사/드라마'] }],
        runningTime: 0,
        episode: 12,
        directors: [BAD_DIRECTOR_ID],
        validationErrors: reg102Errors,
      }),
    },
    {
      meta: makeMeta(201, 'UPDATE', 'INVALID', 25),
      detail: {
        ...upsert('오징어 게임 시즌2', {
          categories: [{ categoryType: '영화', genres: [BAD_GENRE] }],
          validationErrors: up201Errors,
        }),
        contentId: 1,
      } as ContentUpsertJobDetail,
    },
    {
      meta: makeMeta(301, 'DELETE', 'INVALID', 40),
      detail: {
        streamingJobMetricId: null,
        status: 'INVALID',
        errorMessage: null,
        validationErrors: del301Errors,
        retryCount: 0,
        skipCount: 0,
        contentId: BAD_CONTENT_ID,
      } as ContentDeleteJobDetail,
    },
    // FAILED 2건: 서버 처리 중 예외로 남은 작업(재시도 대상)
    {
      meta: makeMeta(103, 'REGISTER', 'FAILED', 8),
      detail: upsert('서울의 봄', {
        status: 'FAILED',
        errorMessage:
          'could not execute statement; Deadlock found when trying to get lock; try restarting transaction',
        retryCount: 1,
        categories: [{ categoryType: '영화', genres: ['액션', '범죄'] }],
      }),
    },
    {
      meta: makeMeta(202, 'UPDATE', 'FAILED', 55),
      detail: {
        ...upsert('무빙', {
          status: 'FAILED',
          errorMessage:
            'Connection is not available, request timed out after 30000ms.',
          retryCount: 2,
        }),
        contentId: 2,
      } as ContentUpsertJobDetail,
    },
    // PENDING 1건
    {
      meta: makeMeta(302, 'DELETE', 'PENDING', 1, 3),
      detail: {
        streamingJobMetricId: null,
        status: 'PENDING',
        errorMessage: null,
        validationErrors: null,
        retryCount: 0,
        skipCount: 0,
        contentId: 3,
      } as ContentDeleteJobDetail,
    },
  ];
};

const PATH_TYPE: Record<string, ContentJobType> = {
  register: 'REGISTER',
  update: 'UPDATE',
  delete: 'DELETE',
};

const validateUpsert = (data: ContentCreateUpdate): JobValidationError[] => {
  const errors: JobValidationError[] = [];
  (data.categories ?? []).forEach((c, i) => {
    if (c.categoryType === BAD_CATEGORY) {
      errors.push(
        err(
          `categories[${i}].categoryType`,
          c.categoryType,
          'CATEGORY_TYPE_BAD_REQUEST',
          '올바르지 않은 분류 타입입니다.',
        ),
      );
    }
    (c.genres ?? []).forEach((g, j) => {
      if (g === BAD_GENRE) errors.push(genreErr(i, j, g));
    });
  });
  (data.platforms ?? []).forEach((p, i) => {
    if (p.platformType === BAD_PLATFORM) {
      errors.push(platformErr(i, p.platformType));
    }
  });
  (data.casts ?? []).forEach((id, i) => {
    if (id === BAD_CAST_ID) errors.push(castErr(i, id));
  });
  (data.directors ?? []).forEach((id, i) => {
    if (id === BAD_DIRECTOR_ID) errors.push(directorErr(i, id));
  });
  return errors;
};

export function createMockJobsAdapter(): AxiosAdapter {
  let jobs = createMockJobs();

  const find = (type: ContentJobType, id: number) =>
    jobs.find((j) => j.meta.jobType === type && j.meta.id === id);

  const respond = (
    config: InternalAxiosRequestConfig,
    status: number,
    data?: unknown,
  ): Promise<AxiosResponse> => {
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
      request: {},
    };
    // 가짜 응답이라도 로딩 상태가 보이도록 잠깐 기다린다.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (status >= 200 && status < 300) resolve(response);
        else {
          reject(
            new AxiosError(
              `Request failed with status code ${status}`,
              status >= 500
                ? AxiosError.ERR_BAD_RESPONSE
                : AxiosError.ERR_BAD_REQUEST,
              config,
              null,
              response,
            ),
          );
        }
      }, 400);
    });
  };

  // 재시도: 서버가 한 번 더 처리한다. #202 는 계속 실패하는 작업으로 흉내낸다.
  const retry = (job: MockJob): 'ok' | 'not-failed' | 'limit-exceeded' => {
    if (job.meta.status !== 'FAILED') return 'not-failed';
    if (job.detail.retryCount >= RETRY_LIMIT) return 'limit-exceeded';
    if (job.meta.id === 202) {
      job.detail.retryCount += 1;
      job.meta.finishedAt = at(0);
      return 'ok';
    }
    jobs = jobs.filter((j) => j !== job); // COMPLETED 가 되어 목록에서 사라짐
    return 'ok';
  };

  return (config) => {
    const url = (config.url ?? '').split('?')[0];
    const method = (config.method ?? 'get').toLowerCase();
    const body =
      typeof config.data === 'string' && config.data
        ? JSON.parse(config.data)
        : config.data;

    // 목록
    if (method === 'get' && /\/api\/admin\/content-jobs$/.test(url)) {
      const type = config.params?.type as ContentJobFilterType;
      const item = jobs
        .filter((j) => j.meta.status === type)
        .map((j) => j.meta)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return respond(config, 200, { item, nextCursor: null, hasNext: false });
    }

    // 상세
    const detailMatch = url.match(
      /\/api\/admin\/content-jobs\/(register|update|delete)\/(\d+)$/,
    );
    if (method === 'get' && detailMatch) {
      const job = find(PATH_TYPE[detailMatch[1]], Number(detailMatch[2]));
      return job
        ? respond(config, 200, { ...job.detail, status: job.meta.status })
        : respond(config, 404, { message: '작업을 찾을 수 없습니다.' });
    }

    // 전체 재시도
    if (method === 'post' && /\/api\/admin\/content-jobs\/retry$/.test(url)) {
      jobs.filter((j) => j.meta.status === 'FAILED').forEach(retry);
      return respond(config, 204);
    }

    // 단건 재시도
    const retryMatch = url.match(
      /\/api\/admin\/content-jobs\/(register|update|delete)\/(\d+)\/retry$/,
    );
    if (method === 'post' && retryMatch) {
      const job = find(PATH_TYPE[retryMatch[1]], Number(retryMatch[2]));
      if (!job) return respond(config, 404, { message: '작업 없음' });
      const result = retry(job);
      if (result === 'ok') return respond(config, 204);
      return result === 'limit-exceeded'
        ? respond(config, 409, {
            code: 'JOB_RETRY_LIMIT_EXCEEDED',
            message: '재시도 한도를 초과했습니다.',
          })
        : respond(config, 409, {
            code: 'JOB_NOT_FAILED',
            message: 'FAILED 상태가 아닌 작업은 재시도할 수 없습니다.',
          });
    }

    // 재제출 (INVALID 만)
    const resubmitMatch = url.match(
      /\/api\/admin\/content-jobs\/(register|update|delete)\/(\d+)\/resubmit$/,
    );
    if (method === 'post' && resubmitMatch) {
      const type = PATH_TYPE[resubmitMatch[1]];
      const id = Number(resubmitMatch[2]);
      const job = find(type, id);
      if (!job) return respond(config, 404, { message: '작업 없음' });
      if (job.meta.status !== 'INVALID') {
        return respond(config, 400, {
          message: 'INVALID 상태의 작업만 재제출할 수 있습니다.',
        });
      }

      const errors =
        type === 'DELETE'
          ? body?.contentId === BAD_CONTENT_ID
            ? [contentErr(BAD_CONTENT_ID)]
            : []
          : validateUpsert(body as ContentCreateUpdate);

      if (errors.length > 0) {
        // 같은 작업이 새 입력값과 새 오류 목록으로 INVALID 상태를 유지한다.
        if (type === 'DELETE') {
          (job.detail as ContentDeleteJobDetail).contentId = body.contentId;
        } else {
          Object.assign(job.detail, body);
        }
        job.detail.validationErrors = errors;
        return respond(config, 400, {
          code: 'VALIDATION_ERROR',
          message: '입력값 검증에 실패했습니다.',
          jobId: id,
          errors,
        });
      }

      jobs = jobs.filter((j) => j !== job); // COMPLETED
      const key = {
        REGISTER: 'registerJobId',
        UPDATE: 'updateJobId',
        DELETE: 'deleteJobId',
      }[type];
      return respond(config, 201, { [key]: id });
    }

    // ContentForm 의 감독/출연진 검색 다이얼로그
    if (method === 'get' && /\/api\/admin\/(casts|directors)$/.test(url)) {
      return respond(config, 200, { item: [], nextCursor: '', hasNext: false });
    }

    return respond(config, 404, {
      message: `mock 에 없는 요청: ${method} ${url}`,
    });
  };
}
