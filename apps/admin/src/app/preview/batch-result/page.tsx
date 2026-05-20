'use client';

import { BatchResultDashboard } from '@components/admin/batch/BatchResultDashboard';
import PreviewBanner from '@app/preview/PreviewBanner';

export default function PreviewBatchResultPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewBanner
        title="배치 결과"
        description="처리 완료된 배치 작업의 집계 결과 mock 화면"
      />
      <main className="flex-1 p-6">
        <BatchResultDashboard />
      </main>
    </div>
  );
}
