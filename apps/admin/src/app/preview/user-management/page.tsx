'use client';

import UserManagement from '@components/admin/userManagement/UserManagement';
import PreviewBanner from '@app/preview/PreviewBanner';

export default function PreviewUserManagementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewBanner
        title="회원 정보 관리"
        description="회원 목록 / 상세 / 메트릭 mock 화면"
      />
      <main className="flex-1 p-6">
        <UserManagement />
      </main>
    </div>
  );
}
