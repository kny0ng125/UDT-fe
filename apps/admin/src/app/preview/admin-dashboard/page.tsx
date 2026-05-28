'use client';

import AdminDashboard from '@components/AdminDashboard';
import PreviewBanner from '@app/preview/PreviewBanner';

export default function PreviewAdminDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewBanner
        title="콘텐츠 관리"
        description="콘텐츠 목록 / 등록 / 수정 / 삭제 흐름의 mock 화면"
      />
      <main className="flex-1">
        <AdminDashboard />
      </main>
    </div>
  );
}
