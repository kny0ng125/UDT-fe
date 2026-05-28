import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useInfiniteFeedbacks } from '@hooks/profile/useInfiniteFeedbacks';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/users/me/feedbacks';

const baseParams = {
  feedbackType: 'LIKED',
  feedbackSortType: 'LATEST',
} as never;

describe('useInfiniteFeedbacks', () => {
  test('IF1: 첫 페이지 fetch → baseParams가 query에 포함, cursor 미포함', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(PATH, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({
          contents: [],
          nextCursor: null,
          hasNext: false,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteFeedbacks(baseParams), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl!.searchParams.get('feedbackType')).toBe('LIKED');
    expect(capturedUrl!.searchParams.get('feedbackSortType')).toBe('LATEST');
  });

  test('IF2: fetchNextPage → 두 번째 호출의 cursor가 첫 응답의 nextCursor', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get(PATH, ({ request }) => {
        const url = new URL(request.url);
        cursors.push(url.searchParams.get('cursor'));
        const isFirst = cursors.length === 1;
        return HttpResponse.json({
          contents: [],
          nextCursor: isFirst ? 100 : null,
          hasNext: isFirst,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteFeedbacks(baseParams), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(cursors[1]).toBe('100');
  });

  test('IF3: 응답 hasNext=true → hasNextPage=true', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          contents: [],
          nextCursor: 50,
          hasNext: true,
        }),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteFeedbacks(baseParams), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });

  test('IF4: hasNext=false → hasNextPage=false', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          contents: [],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteFeedbacks(baseParams), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  test('IF5: feedbackType 변경 → 다른 queryKey (캐시 분리)', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          contents: [],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );
    const { Wrapper, queryClient } = createQueryWrapper();
    const { rerender } = renderHook(
      ({ type }) =>
        useInfiniteFeedbacks({
          feedbackType: type,
          feedbackSortType: 'LATEST',
        } as never),
      { wrapper: Wrapper, initialProps: { type: 'LIKED' } },
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryData(['feedbacks', 'LIKED', 'LATEST']),
      ).toBeDefined(),
    );
    rerender({ type: 'DISLIKED' });
    await waitFor(() =>
      expect(
        queryClient.getQueryData(['feedbacks', 'DISLIKED', 'LATEST']),
      ).toBeDefined(),
    );
  });
});
