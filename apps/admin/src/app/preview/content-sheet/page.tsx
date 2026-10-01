'use client';

import ContentSheet from '@components/ContentSheet';
import PreviewBanner from '@app/preview/PreviewBanner';

// 시트 등록 화면 확인용. 로그인/서버 없이도 붙여넣기와 형식 검증을 볼 수 있다.
export default function ContentSheetPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PreviewBanner
        title="시트 등록 미리보기"
        description="서버 없이 붙여넣기·형식 검증까지 확인할 수 있어요. 등록 버튼은 서버 연결이 필요해요."
      />
      <div className="mx-auto max-w-[900px] p-6">
        {/* 실제 다이얼로그(grid)와 같은 조건에서 폭이 넘치지 않는지 보려고 grid로 감싼다 */}
        <div className="grid rounded-lg border bg-white p-6">
          <ContentSheet onClose={() => undefined} />
        </div>
      </div>
    </div>
  );
}
