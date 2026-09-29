import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  useContentJobDetail,
  useInfiniteContentJobs,
  useResubmitContentJob,
  useRetryContentJob,
} from '@hooks/admin/useContentJobs';
import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';
import { createQueryWrapper } from '../_helpers/queryClient';
import * as Toast from '@udt/ui/common/Toast';

beforeEach(() => {
  jest.spyOn(Toast.showSimpleToast, 'success').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useContentJobs', () => {
  test('CJ1: 목록 조회 → type/size 쿼리 전달, 다음 커서로 이어서 조회', async () => {
    const received: Array<Record<string, string | null>> = [];
    server.use(
      http.get('/api/admin/content-jobs', ({ request }) => {
        const url = new URL(request.url);
        received.push({
          type: url.searchParams.get('type'),
          size: url.searchParams.get('size'),
          cursor: url.searchParams.get('cursor'),
        });
        const first = !url.searchParams.get('cursor');
        return HttpResponse.json({
          item: [
            {
              id: first ? 2 : 1,
              status: 'FAILED',
              memberId: 7,
              createdAt: '2026-05-28T10:00:00',
              scheduledAt: null,
              finishedAt: '2026-05-28T10:00:01',
              jobType: 'REGISTER',
            },
          ],
          nextCursor: first ? '2|2026-05-28T10:00:00|REGISTER' : null,
          hasNext: first,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteContentJobs('FAILED'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(received[0]).toEqual({ type: 'FAILED', size: '20', cursor: null });

    let next:
      | Awaited<ReturnType<typeof result.current.fetchNextPage>>
      | undefined;
    await act(async () => {
      next = await result.current.fetchNextPage();
    });
    expect(received[1].cursor).toBe('2|2026-05-28T10:00:00|REGISTER');
    expect(next?.data?.pages).toHaveLength(2);
    expect(next?.hasNextPage).toBe(false);
  });

  test.each([
    ['REGISTER', 'register'],
    ['UPDATE', 'update'],
    ['DELETE', 'delete'],
  ] as const)(
    'CJ2: %s 상세 조회 → /content-jobs/%s/{jobId}',
    async (jobType, segment) => {
      let hit = '';
      server.use(
        http.get(`/api/admin/content-jobs/${segment}/:jobId`, ({ params }) => {
          hit = String(params.jobId);
          return HttpResponse.json({ status: 'INVALID', validationErrors: [] });
        }),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(() => useContentJobDetail(jobType, 5), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(hit).toBe('5');
    },
  );

  test('CJ3: 단건 재시도 → 작업 종류별 retry 경로 + 목록 invalidate', async () => {
    let hit = '';
    server.use(
      http.post('/api/admin/content-jobs/update/:jobId/retry', ({ params }) => {
        hit = String(params.jobId);
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useRetryContentJob(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ jobType: 'UPDATE', jobId: 12 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hit).toBe('12');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['adminContentJobs'],
    });
  });

  test('CJ4: 삭제 작업 재제출 → body 에 contentId', async () => {
    let body: unknown = null;
    server.use(
      http.post(
        '/api/admin/content-jobs/delete/:jobId/resubmit',
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ deleteJobId: 3 });
        },
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResubmitContentJob(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ jobType: 'DELETE', jobId: 3, contentId: 77 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ contentId: 77 });
  });

  test('CJ5: 재제출이 다시 검증 실패(400) → 필드별 오류를 추출할 수 있다', async () => {
    server.use(
      http.post('/api/admin/content-jobs/register/:jobId/resubmit', () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: '입력 검증 실패',
            jobId: 9,
            errors: [
              {
                field: 'categories[0].genres[1]',
                value: '없는장르',
                code: 'GENRE_NOT_FOUND',
                message: '존재하지 않는 장르입니다.',
              },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResubmitContentJob(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      jobType: 'REGISTER',
      jobId: 9,
      data: { title: 'x' } as never,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const extracted = extractBulkValidationError(result.current.error);
    expect(extracted?.errors[0].field).toBe('categories[0].genres[1]');
  });
});
