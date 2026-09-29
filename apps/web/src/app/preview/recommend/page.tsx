'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RecommendationPage from '@app/recommend/page';
import { useRecommendStore } from '@store/useRecommendStore';
import { getCurrentCuratedContentKey } from '@hooks/recommend/useGetCuratedContents';
import { PreviewQueryProvider } from '../_mocks/PreviewQueryProvider';
import { PreviewFrame } from '../_mocks/PreviewFrame';
import { mockMoviePool, mockCuratedContents } from '../_mocks/recommend';

type Phase = 'start' | 'recommend' | 'result';

// recommend 는 react-query 가 아니라 zustand(moviePool) + phase 흐름으로 동작.
// ?phase=start|recommend|result 로 단계별 미리보기 (기본 recommend).
// result phase 의 useGetCuratedContents(react-query)는 PreviewQueryProvider 로 시딩.
function PreviewRecommendInner() {
  const params = useSearchParams();
  const phase = (params.get('phase') as Phase) || 'recommend';

  const setMoviePool = useRecommendStore((s) => s.setMoviePool);
  const setPhase = useRecommendStore((s) => s.setPhase);
  const initSaved = useRecommendStore((s) => s.initializeSavedContentIds);
  const initResultSaved = useRecommendStore(
    (s) => s.initializeResultSavedContents,
  );

  useEffect(() => {
    setMoviePool(mockMoviePool);
    initSaved(mockMoviePool.length);
    initResultSaved(mockMoviePool.length);
    setPhase(phase);
  }, [phase, setMoviePool, setPhase, initSaved, initResultSaved]);

  return (
    <PreviewFrame label={`recommend · phase=${phase}`}>
      <RecommendationPage />
    </PreviewFrame>
  );
}

export default function PreviewRecommendPage() {
  return (
    <PreviewQueryProvider
      seeds={[
        {
          queryKey: ['curatedContents', getCurrentCuratedContentKey()],
          data: mockCuratedContents,
        },
      ]}
    >
      <Suspense fallback={null}>
        <PreviewRecommendInner />
      </Suspense>
    </PreviewQueryProvider>
  );
}
