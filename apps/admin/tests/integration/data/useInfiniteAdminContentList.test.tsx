import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useInfiniteAdminContentList } from '@hooks/admin/useGetContentList';
import { createQueryWrapper } from '../_helpers/queryClient';

const PATH = '/api/admin/contents';

describe('useInfiniteAdminContentList', () => {
  test('IL1: 첫 페이지 fetch → cursor 미포함 + size 포함', async () => {
    let url: URL | null = null;
    server.use(
      http.get(PATH, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          items: [],
          hasNext: false,
          nextCursor: null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () =>
        useInfiniteAdminContentList({
          size: 20,
          categoryType: '영화',
        } as never),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url!.searchParams.get('size')).toBe('20');
  });

  test('IL2: categoryType="all" → API에 categoryType 미전달', async () => {
    let categoryParam: string | null = '';
    server.use(
      http.get(PATH, ({ request }) => {
        const u = new URL(request.url);
        categoryParam = u.searchParams.get('categoryType');
        return HttpResponse.json({
          items: [],
          hasNext: false,
          nextCursor: null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () =>
        useInfiniteAdminContentList({
          size: 20,
          categoryType: 'all',
        } as never),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryParam).toBeNull();
  });

  test('IL3: categoryType="영화" → API에 categoryType="영화" 전달', async () => {
    let categoryParam: string | null = null;
    server.use(
      http.get(PATH, ({ request }) => {
        const u = new URL(request.url);
        categoryParam = u.searchParams.get('categoryType');
        return HttpResponse.json({
          items: [],
          hasNext: false,
          nextCursor: null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () =>
        useInfiniteAdminContentList({
          size: 20,
          categoryType: '영화',
        } as never),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryParam).toBe('영화');
  });

  test('IL4: fetchNextPage → 두 번째 호출 cursor가 첫 응답 nextCursor', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get(PATH, ({ request }) => {
        const u = new URL(request.url);
        cursors.push(u.searchParams.get('cursor'));
        const isFirst = cursors.length === 1;
        return HttpResponse.json({
          items: [],
          hasNext: isFirst,
          nextCursor: isFirst ? 'abc' : null,
        });
      }),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () =>
        useInfiniteAdminContentList({
          size: 20,
          categoryType: '영화',
        } as never),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(cursors[1]).toBe('abc');
  });

  test('IL5: hasNext=true → hasNextPage=true', async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({
          items: [],
          hasNext: true,
          nextCursor: 'x',
        }),
      ),
    );
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () =>
        useInfiniteAdminContentList({
          size: 20,
          categoryType: '영화',
        } as never),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});
