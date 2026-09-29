'use client';

import ExploreClient from '@app/explore/ExploreClient';
import { PreviewQueryProvider } from '../_mocks/PreviewQueryProvider';
import { PreviewFrame } from '../_mocks/PreviewFrame';
import { exploreSeeds } from '../_mocks/explore';

// mock 데이터 기반 explore preview — 백엔드/인증 없이 채워진 화면 확인.
// 실제 explore RSC 의 prefetch 를 mock 캐시 시딩으로 대체한다.
export default function PreviewExplorePage() {
  return (
    <PreviewQueryProvider seeds={exploreSeeds}>
      <PreviewFrame label="explore (mock)">
        <ExploreClient />
      </PreviewFrame>
    </PreviewQueryProvider>
  );
}
