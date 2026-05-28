import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useUpdateContent } from '@hooks/admin/usePatchContent';
import { createQueryWrapper } from '../_helpers/queryClient';
import * as Toast from '@udt/ui/common/Toast';

const PATH = '/api/admin/contents/updatejob/:contentId';

let successSpy: jest.SpyInstance;

beforeEach(() => {
  successSpy = jest
    .spyOn(Toast.showSimpleToast, 'success')
    .mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useUpdateContent', () => {
  test('UC1: mutate({contentId, data}) → patchContent로 contentId/data 전달', async () => {
    let receivedPath = '';
    let receivedBody: unknown = null;
    server.use(
      http.post(PATH, async ({ request, params }) => {
        receivedPath = String(params.contentId);
        receivedBody = await request.json();
        return HttpResponse.json({ updateJobId: 1 });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate({
      contentId: 42,
      data: { title: 'X' } as never,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedPath).toBe('42');
    expect(receivedBody).toEqual({ title: 'X' });
  });

  test('UC2: 성공 → invalidate([infiniteAdminContentList])', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ updateJobId: 1 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ contentId: 42, data: {} as never });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['infiniteAdminContentList'],
    });
  });

  test('UC3: 성공 → invalidate([adminContentDetail, contentId])', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ updateJobId: 1 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ contentId: 42, data: {} as never });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['adminContentDetail', 42],
    });
  });

  test('UC4: 성공 → "콘텐츠 수정 요청이 전송되었습니다." 토스트', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ updateJobId: 1 })));
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ contentId: 42, data: {} as never });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(successSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '콘텐츠 수정 요청이 전송되었습니다.',
      }),
    );
  });
});
