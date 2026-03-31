'use client';

import { FilterRadioButtonGroup } from '@components/explore/FilterRadioButtonGroup';
import { ExplorePageCarousel } from '@components/explore/ExplorePageCarousel';
import { createFilterRequestParam } from '@udt/shared/utils/createFilterRequestParam';
import { PosterCardsGrid } from '@components/explore/PosterCardsGrid';
import { useGetFilteredContents } from '@hooks/explore/useGetFilteredContents';

import {
  useExploreFilters,
  useExploreInitializer,
} from '@hooks/useExplorePageState';
import { PosterCardScrollBox } from '@components/explore/PosterCardScrollBox';
import { useFetchTodayRecommendSentence } from '@hooks/explore/useFetchTodayRecommendSentence';
import { usePageStayTracker } from '@udt/shared/hooks/usePageStayTracker';
import { useQueryErrorToast } from '@udt/shared/hooks/useQueryErrorToast';

export default function ExplorePage() {
  // 페이지 머무르는 시간 추적 (탐색 페이지 추적 / Google Analytics 연동을 위함)
  usePageStayTracker('explore');

  // 초기화 (필터 옵션 로드)
  useExploreInitializer();

  // 필터 상태 구독
  const { appliedFilters } = useExploreFilters();

  // 필터 상태 변환
  const filters = appliedFilters.length > 0 ? appliedFilters : undefined;

  // 필터링된 콘텐츠 목록 조회 (필터 옵션을 이용해서 request param 생성해서 데이터를 받아온다, filter 비어 있으면 수행 X)
  const getFilteredContentsQuery = useGetFilteredContents({
    size: 18,
    filters: createFilterRequestParam(filters ?? []),
    enabled: filters !== undefined,
  });

  // 쿼리에서 에러가 발생했을 경우, 토스트 띄우기
  useQueryErrorToast(getFilteredContentsQuery);

  // getFilteredContentsQuery 객체에서 필요한 것 추출
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    getFilteredContentsQuery;

  // 필터링된 콘텐츠 목록 데이터 추출
  const contents = data?.pages.flatMap((page) => page.item) || [];

  // 오늘 추천 문구 추출 (SSR/Hydration 이슈 해결을 위해 customHook 사용)
  const todayRecommendSentence = useFetchTodayRecommendSentence();

  return (
    <div className="flex flex-col min-h-screen w-full bg-transparent">
      {/* 1. 최상단 제목 (이건 항상 맨 위에 있으나, 아래의 overflow-y-auto 영역에 안 들어감) */}
      <div className="flex items-center justify-center pt-6">
        <span className="text-2xl font-semibold text-white">작품 탐색하기</span>
      </div>

      {/* 2. FilterRadioButtonGroup의 sticky 옵션은 해당 컴포넌트 내부에 둔다! */}
      <FilterRadioButtonGroup />

      {/* 3. 나머지 모든 콘텐츠가 스크롤되는 영역 (여기에서만 overflow-y-auto 속성 사용, 가로 스크롤은 방지) */}
      <div className="flex-1 flex flex-col h-full overflow-x-hidden overflow-y-auto pb-15">
        {filters !== undefined ? (
          <PosterCardsGrid
            contents={contents}
            status={status}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
          />
        ) : (
          <div className="container mx-auto space-y-6 py-4">
            <div className="w-full">
              <ExplorePageCarousel autoPlayInterval={3000} />
            </div>
            <PosterCardScrollBox
              BoxTitle={todayRecommendSentence}
              BoxType="todayRecommend"
            />
            <PosterCardScrollBox
              BoxTitle="지금 🔥Hot🔥한 콘텐츠"
              BoxType="popular"
            />
            <PosterCardScrollBox
              BoxTitle="🎥플랫폼별 인기 콘텐츠!"
              BoxType="platformPicks"
            />
          </div>
        )}
      </div>
    </div>
  );
}
