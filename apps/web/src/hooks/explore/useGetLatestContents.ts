import { useQuery } from '@tanstack/react-query';
import { RecentContentData } from '@type/explore/Explore';
import { getLatestContents } from '@lib/apis/explore/getLatestContents';

// OTT 콘텐츠 인기 목록 조회 API 호출하는 custom Hook
export const useGetLatestContents = () => {
  return useQuery<RecentContentData[]>({
    queryKey: ['latestContents'],
    queryFn: () => getLatestContents(10),
    staleTime: 60 * 1000, // 60초 fresh (RSC prefetch 활용)
    gcTime: 5 * 60 * 1000, // 5분 캐시 유지
    refetchOnWindowFocus: false, // UX 보호용
    retry: 2, // 자동 재시도(최대 2번까지)
    retryDelay: 1000, // 재시도 딜레이(1초)
  });
};
