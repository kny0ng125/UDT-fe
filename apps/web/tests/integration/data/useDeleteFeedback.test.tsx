import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useDeleteFeedback } from '@hooks/profile/useDeleteFeedback';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/users/me/feedbacks';

describe('useDeleteFeedback', () => {
  test('DF1: mutate(feedbackIds) → body에 feedbackIds 그대로 전달', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.delete(PATH, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteFeedback(), {
      wrapper: Wrapper,
    });
    result.current.mutate([10, 20]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedBody).toEqual({ feedbackIds: [10, 20] });
  });

  test('DF2: 성공 → invalidateQueries({queryKey:["feedbacks"]})', async () => {
    server.use(http.delete(PATH, () => HttpResponse.json({}, { status: 200 })));
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteFeedback(), {
      wrapper: Wrapper,
    });
    result.current.mutate([10]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feedbacks'] });
  });
});
