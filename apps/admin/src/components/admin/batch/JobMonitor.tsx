import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Button } from '@udt/ui/components/button';
import { BatchRequestQueueTopCardSection } from '@components/admin/batch/BatchRequestQueueTopCardSection';
import { JobTypeDropdown } from '@components/admin/batch/JobTypeDropDown';
import {
  JobsTable,
  type MonitorStatus,
} from '@components/admin/batch/JobsTable';
import { usePostRetryFailedJobs } from '@hooks/admin/usePostRetryFailedJobs';
import { useDeleteInvalidJobs } from '@hooks/admin/useDeleteInvalidJobs';

const STATUS_OPTIONS: { value: MonitorStatus; label: string }[] = [
  { value: 'PENDING', label: '대기 중' },
  { value: 'FAILED', label: '실패' },
  { value: 'INVALID', label: '무효' },
];

const STATUS_LABEL_TO_VALUE = STATUS_OPTIONS.reduce(
  (acc, o) => {
    acc[o.label] = o.value;
    return acc;
  },
  {} as Record<string, MonitorStatus>,
);

const TITLE_BY_STATUS: Record<MonitorStatus, string> = {
  PENDING: '대기 중 작업',
  FAILED: '실패한 작업',
  INVALID: '무효화된 작업',
};

export function JobMonitor() {
  const [status, setStatus] = useState<MonitorStatus>('PENDING');

  const { mutate: postRetryFailedJobs, isPending: isRetrying } =
    usePostRetryFailedJobs();
  const { mutate: deleteInvalidJobs, isPending: isDeleting } =
    useDeleteInvalidJobs();

  const renderAction = () => {
    if (status === 'FAILED') {
      return (
        <Button
          variant="default"
          disabled={isRetrying}
          className="ml-2"
          onClick={() => postRetryFailedJobs()}
        >
          {isRetrying ? '재시도 중...' : '실패 작업 일괄 재시도'}
        </Button>
      );
    }
    if (status === 'INVALID') {
      return (
        <Button
          variant="destructive"
          disabled={isDeleting}
          className="ml-2"
          onClick={() => deleteInvalidJobs()}
        >
          {isDeleting ? '삭제 중...' : '무효 작업 일괄 삭제'}
        </Button>
      );
    }
    return null;
  };

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)!.label;

  return (
    <div className="flex flex-col gap-6">
      <BatchRequestQueueTopCardSection />

      <Card className="flex flex-col py-4 px-2">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
              {TITLE_BY_STATUS[status]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <JobTypeDropdown
                options={STATUS_OPTIONS.map((o) => o.label)}
                value={statusLabel}
                onChange={(label) => {
                  const next = STATUS_LABEL_TO_VALUE[label];
                  if (next) setStatus(next);
                }}
              />
              {renderAction()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0">
          <JobsTable status={status} typeFilter="전체" />
        </CardContent>
      </Card>
    </div>
  );
}
