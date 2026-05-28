import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { usePostContent } from '@hooks/admin/usePostContent';
import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';
import { createQueryWrapper } from '../_helpers/queryClient';
import * as Toast from '@udt/ui/common/Toast';

const PATH = '/api/admin/contents/registerjob';

let successSpy: jest.SpyInstance;

beforeEach(() => {
  successSpy = jest
    .spyOn(Toast.showSimpleToast, 'success')
    .mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePostContent', () => {
  test('PC1: mutate(data) → postContent로 data 전달', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(PATH, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ registerJobId: 1 });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePostContent(), { wrapper: Wrapper });
    result.current.mutate({ title: 'Inception' } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedBody).toEqual({ title: 'Inception' });
  });

  test('PC2: 성공 → invalidate + "콘텐츠 등록 요청이 전송되었습니다." 토스트', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ registerJobId: 1 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => usePostContent(), { wrapper: Wrapper });
    result.current.mutate({} as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['infiniteAdminContentList'],
    });
    expect(successSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '콘텐츠 등록 요청이 전송되었습니다.',
      }),
    );
  });

  test('PC3: 400 BulkValidationError → isError + extractBulkValidationError로 파싱 가능', async () => {
    server.use(
      http.post(PATH, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: '검증 실패',
            jobId: 7,
            errors: [{ field: 'title', message: '필수', code: 'REQUIRED' }],
          },
          { status: 400 },
        ),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePostContent(), { wrapper: Wrapper });
    result.current.mutate({} as never);
    await waitFor(() => expect(result.current.isError).toBe(true));

    const parsed = extractBulkValidationError(result.current.error);
    expect(parsed).not.toBeNull();
    expect(parsed?.code).toBe('VALIDATION_ERROR');
    expect(parsed?.jobId).toBe(7);
    expect(parsed?.errors).toHaveLength(1);
  });
});
