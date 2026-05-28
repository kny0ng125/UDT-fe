import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useDeleteCurated } from '@hooks/profile/useDeleteCurated';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/api/users/me/curated/contents/bulk';

describe('useDeleteCurated', () => {
  test('DC1: mutate(contentIds) → body에 contentIds 그대로 전달', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.delete(PATH, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteCurated(), {
      wrapper: Wrapper,
    });
    result.current.mutate([1, 2, 3]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedBody).toEqual({ contentIds: [1, 2, 3] });
  });

  test('DC2: 성공 → invalidateQueries({queryKey:["curatedContents"]})', async () => {
    server.use(http.delete(PATH, () => HttpResponse.json({}, { status: 200 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteCurated(), {
      wrapper: Wrapper,
    });
    result.current.mutate([1]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['curatedContents'],
    });
  });
});
