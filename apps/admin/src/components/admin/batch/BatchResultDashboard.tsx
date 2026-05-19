import { BatchResultDashboardTable } from '@components/admin/batch/BatchResultDashboardTable';
import { BatchResultTopCardSection } from '@components/admin/batch/BatchResultTopCardSection';

// '배치 결과' 페이지: 처리 완료된 배치의 집계만 표시.
// 실패/무효 작업은 '작업 모니터' 탭의 JobMonitor로 이동됨.
export function BatchResultDashboard() {
  return (
    <div className="space-y-6">
      <BatchResultTopCardSection />
      <BatchResultDashboardTable />
    </div>
  );
}
