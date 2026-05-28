import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useDeleteContent } from '@hooks/admin/useDeleteContent';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/admin/contents/deletejob/:contentId';

describe('useDeleteContent', () => {
  test('DC1: mutate(contentId) → deleteContent로 contentId 전달', async () => {
    let receivedPath = '';
    server.use(
      http.post(PATH, ({ params }) => {
        receivedPath = String(params.contentId);
        return HttpResponse.json({ deleteJobId: 1 });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate(99);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedPath).toBe('99');
  });

  test('DC2: 성공 → invalidate([infiniteAdminContentList])', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ deleteJobId: 1 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: Wrapper,
    });
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['infiniteAdminContentList'],
    });
  });
});
