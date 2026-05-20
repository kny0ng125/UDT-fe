'use client';

import { useEffect } from 'react';
import RecommendationPage from '@app/recommend/page';
import { useRecommendStore } from '@store/useRecommendStore';
import type { TicketComponent } from '@type/recommend/TicketComponent';

const PREVIEW_MOVIES: TicketComponent[] = Array.from({ length: 10 }).map(
  (_, i) => ({
    contentId: 1000 + i,
    title: `샘플 콘텐츠 ${i + 1}`,
    description:
      '미리보기용 mock 콘텐츠입니다. 실제 API 응답 없이도 카드 UI를 확인할 수 있도록 더미 데이터로 채워졌습니다.',
    posterUrl: '/images/default-poster.png',
    backdropUrl: '/images/default-backdrop.png',
    openDate: '2026-01-01',
    runningTime: 120,
    episode: '0',
    rating: '15세',
    category: '영화',
    genres: ['액션', 'SF'],
    directors: ['샘플 감독'],
    casts: ['샘플 배우 1', '샘플 배우 2'],
    platforms: ['NETFLIX'],
    watchUrls: ['https://example.com/watch'],
  }),
);

export default function PreviewRecommendPage() {
  const setMoviePool = useRecommendStore((s) => s.setMoviePool);
  const setPhase = useRecommendStore((s) => s.setPhase);
  const initSaved = useRecommendStore((s) => s.initializeSavedContentIds);
  const initResultSaved = useRecommendStore(
    (s) => s.initializeResultSavedContents,
  );

  useEffect(() => {
    setMoviePool(PREVIEW_MOVIES);
    setPhase('recommend');
    initSaved(PREVIEW_MOVIES.length);
    initResultSaved(PREVIEW_MOVIES.length);
  }, [setMoviePool, setPhase, initSaved, initResultSaved]);

  return (
    <div className="relative w-full min-h-[100svh]">
      <div className="sticky top-0 z-[100] bg-yellow-400/90 text-black text-xs text-center py-1">
        🧪 Preview — recommend (mock movie pool 10개, phase=recommend)
      </div>
      <RecommendationPage />
    </div>
  );
}
