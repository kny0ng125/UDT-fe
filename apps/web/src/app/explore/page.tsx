import { cookies } from 'next/headers';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import ExploreClient from './ExploreClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const PREFETCH_STALE_TIME = 60 * 1000;

async function fetchOnServer<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to prefetch ${path}: ${res.status}`);
  }
  return res.json();
}

export default async function ExplorePage() {
  const queryClient = new QueryClient();

  // 초기 진입(필터 미적용) 시 보이는 4개 쿼리를 병렬 prefetch
  // queryFn 실패는 prefetchQuery가 silent 처리 → 클라이언트가 fallback으로 재시도
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['latestContents'],
      queryFn: () => fetchOnServer('/api/contents/recent?size=10'),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['popularContents'],
      queryFn: () => fetchOnServer('/api/contents/popular?size=10'),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['todayRecommendContents'],
      queryFn: () => fetchOnServer('/api/contents/weekly?size=10'),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['platformPicksContents'],
      queryFn: () => fetchOnServer('/api/platforms/popular-contents'),
      staleTime: PREFETCH_STALE_TIME,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExploreClient />
    </HydrationBoundary>
  );
}
