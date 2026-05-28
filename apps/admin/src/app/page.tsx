'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@udt/ui/components/button';
import AdminDashboard from '@components/AdminDashboard';
import { JobMonitor } from '@components/batch/JobMonitor';
import { SmoothExpandableSidebar } from '@components/SmoothExpandableSidebar';
import UserManagement from '@components/userManagement/UserManagement';
import Image from 'next/image';
import { useLogoutHandler } from '@hooks/useLogoutHandler';

type TabType = 'job-monitor' | 'content-management' | 'member-management';

const tabConfig = {
  'content-management': {
    title: '콘텐츠 관리',
    description: '사이트의 콘텐츠를 생성, 수정, 삭제할 수 있습니다',
    component: AdminDashboard,
  },
  'job-monitor': {
    title: '요청 모니터',
    description: '대기 중·실패·무효 요청의 처리 상태를 실시간으로 확인합니다',
    component: JobMonitor,
  },
  'member-management': {
    title: '회원 정보 관리',
    description: '회원 정보를 조회하고 관리할 수 있습니다',
    component: UserManagement,
  },
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('content-management');
  const { handleLogout } = useLogoutHandler();

  const currentTab = tabConfig[activeTab];
  const CurrentComponent = currentTab.component;

  return (
    <div className="min-h-screen flex flex-col bg-background transition-all duration-300 ease-out">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="flex flex-row justify-start items-center">
          <Image
            src="/icons/firefly-adminpage-logo.png"
            alt="logo"
            width={48}
            height={48}
            className="object-contain mr-4"
            unoptimized
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground leading-tight">
              {currentTab.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-tight">
              {currentTab.description}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </Button>
      </header>

      <div className="relative flex-1">
        <SmoothExpandableSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <main className="ml-16 p-6">
          <div
            key={activeTab}
            className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
          >
            <CurrentComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
