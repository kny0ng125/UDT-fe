'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import axiosInstance from '@udt/shared/apis/axiosInstance';
import { Button } from '@udt/ui/components/button';
import { JobMonitor } from '@components/batch/JobMonitor';
import { SmoothExpandableSidebar } from '@components/SmoothExpandableSidebar';
import {
  CONTENT_JOBS_KEY,
  CONTENT_JOB_DETAIL_KEY,
} from '@hooks/admin/useContentJobs';
import { createMockJobsAdapter } from '@app/preview/job-monitor/mockJobsAdapter';

// 요청 모니터를 서버 없이, 실제 관리자 화면(app/page.tsx)과 같은 껍데기로 보여주는 페이지.
// 이 페이지에 있는 동안에만 axios 응답을 가짜로 바꾸고, 나가면 원래대로 돌려 놓는다.
// mock 의 동작 규칙은 mockJobsAdapter.ts 의 MOCK_RULES 에 적혀 있다.
export default function JobMonitorPreviewPage() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const original = axiosInstance.defaults.adapter;
    const clear = () => {
      queryClient.removeQueries({ queryKey: [CONTENT_JOBS_KEY] });
      queryClient.removeQueries({ queryKey: [CONTENT_JOB_DETAIL_KEY] });
    };
    clear();
    axiosInstance.defaults.adapter = createMockJobsAdapter();
    setReady(true);
    return () => {
      axiosInstance.defaults.adapter = original;
      clear();
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
              요청 모니터
            </h1>
            <p className="text-sm text-muted-foreground leading-tight">
              대기 중·실패·무효 요청의 처리 상태를 실시간으로 확인합니다
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          로그아웃
        </Button>
      </header>

      <div className="relative flex-1">
        <SmoothExpandableSidebar
          activeTab="job-monitor"
          onTabChange={() => undefined}
        />
        <main className="ml-16 p-6">{ready && <JobMonitor />}</main>
      </div>
    </div>
  );
}
