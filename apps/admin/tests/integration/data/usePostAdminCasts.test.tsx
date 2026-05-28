import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { usePostAdminCasts } from '@hooks/admin/usePostCasts';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/admin/casts';

describe('usePostAdminCasts', () => {
  test('CA1: mutate(data) → postAdminCasts로 data 전달', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(PATH, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ castIds: [1, 2] });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePostAdminCasts(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ casts: [{ name: '배우A' }] } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedBody).toEqual({ casts: [{ name: '배우A' }] });
  });

  test('CA2: 성공 → invalidate([infiniteAdminCasts])', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ castIds: [1] })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => usePostAdminCasts(), {
      wrapper: Wrapper,
    });
    result.current.mutate({} as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['infiniteAdminCasts'],
    });
  });
});
