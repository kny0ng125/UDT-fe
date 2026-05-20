'use client';

import ExplorePage from '@app/explore/page';

// 인증 없이 explore 화면 mock 확인.
// 데이터 API들은 백엔드 없이는 빈 응답/에러로 처리되지만, 페이지 골격/필터 UI는 확인 가능.
export default function PreviewExplorePage() {
  return (
    <div className="relative w-full min-h-[100svh]">
      <div className="sticky top-0 z-[100] bg-yellow-400/90 text-black text-xs text-center py-1">
        🧪 Preview — explore (API 응답 없으면 카드/필터 빈 상태로 보일 수 있음)
      </div>
      <ExplorePage />
    </div>
  );
}
