import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useInfiniteUsers } from '@hooks/admin/useInfiniteScroll';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/admin/users';

describe('useInfiniteUsers', () => {
  test('IU1: 첫 fetch → keyword + size=20 포함', async () => {
    let url: URL | null = null;
    server.use(
      http.get(PATH, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          item: [],
          hasNext: false,
          nextCursor: null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteUsers('alice'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(url!.searchParams.get('keyword')).toBe('alice');
    expect(url!.searchParams.get('size')).toBe('20');
  });

  test('IU2: keyword 변경 → 다른 queryKey (캐시 분리)', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          item: [],
          hasNext: false,
          nextCursor: null,
        }),
      ),
    );
    const { Wrapper, queryClient } = createQueryWrapper();
    const { rerender } = renderHook(({ kw }) => useInfiniteUsers(kw), {
      wrapper: Wrapper,
      initialProps: { kw: 'alice' },
    });
    await waitFor(() =>
      expect(queryClient.getQueryData(['userList', 'alice'])).toBeDefined(),
    );
    rerender({ kw: 'bob' });
    await waitFor(() =>
      expect(queryClient.getQueryData(['userList', 'bob'])).toBeDefined(),
    );
  });

  test('IU3: fetchNextPage → cursor 갱신', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get(PATH, ({ request }) => {
        const u = new URL(request.url);
        cursors.push(u.searchParams.get('cursor'));
        const isFirst = cursors.length === 1;
        return HttpResponse.json({
          item: [],
          hasNext: isFirst,
          nextCursor: isFirst ? 'u-2' : null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteUsers(''), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(cursors[1]).toBe('u-2');
  });

  test('IU4: hasNext=true → hasNextPage=true', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          item: [],
          hasNext: true,
          nextCursor: 'x',
        }),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteUsers(''), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasNextPage).toBe(true);
  });

  test('IU5: users는 pages.flatMap(p => p.item) 결과', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          item: [{ id: 1 }, { id: 2 }],
          hasNext: false,
          nextCursor: null,
        }),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useInfiniteUsers(''), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.users.length).toBe(2));
    expect(result.current.users).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
