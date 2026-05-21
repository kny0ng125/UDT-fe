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

export default function ExploreClient() {
  usePageStayTracker('explore');

  useExploreInitializer();

  const { appliedFilters } = useExploreFilters();

  const filters = appliedFilters.length > 0 ? appliedFilters : undefined;

  const getFilteredContentsQuery = useGetFilteredContents({
    size: 18,
    filters: createFilterRequestParam(filters ?? []),
    enabled: filters !== undefined,
  });

  useQueryErrorToast(getFilteredContentsQuery);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    getFilteredContentsQuery;

  const contents = data?.pages.flatMap((page) => page.item) || [];

  const todayRecommendSentence = useFetchTodayRecommendSentence();

  return (
    <div className="flex flex-col min-h-screen w-full bg-transparent">
      <div className="flex items-center justify-center pt-6">
        <span className="text-2xl font-semibold text-white">작품 탐색하기</span>
      </div>

      <FilterRadioButtonGroup />

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
