import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@udt/ui/components/table';
import { Badge } from '@udt/ui/components/badge';
import { Button } from '@udt/ui/components/button';
import { AnimatePresence, motion } from 'framer-motion';

const MotionTableRow = motion.create(TableRow);

export type MonitorStatus = 'PENDING' | 'FAILED' | 'INVALID';
type MonitorFilter = MonitorStatus | 'ALL';

export type JobItem = {
  id: number;
  status: MonitorStatus | 'COMPLETED' | 'PROCESSING';
  memberId: number;
  createdAt: string;
  updateAt: string;
  finishedAt?: string;
  jobType: 'REGISTER' | 'UPDATE' | 'DELETE';
  scheduledAt: string;
};

const STATUS_COPY: Record<
  MonitorFilter,
  { errorToast: string; emptyMessage: string }
> = {
  PENDING: {
    errorToast: '대기 중 요청 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '대기 중 요청이 없습니다.',
  },
  FAILED: {
    errorToast: '실패한 요청 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '실패한 요청이 없습니다.',
  },
  INVALID: {
    errorToast: '무효화된 요청 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '무효화된 요청이 없습니다.',
  },
  ALL: {
    errorToast: '요청 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '조건에 맞는 요청이 없습니다.',
  },
};

const REQUEST_STATUS_CONFIG = {
  FAILED: { label: '실패', color: 'bg-red-100 text-red-800' },
  INVALID: { label: '무효', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: '성공', color: 'bg-green-100 text-green-800' },
  PENDING: { label: '대기중', color: 'bg-orange-100 text-orange-800' },
  PROCESSING: { label: '처리중', color: 'bg-blue-100 text-blue-800' },
} as const;

interface JobsTableViewProps {
  status: MonitorFilter;
  typeFilter: string;
  jobs: JobItem[] | undefined;
  queryStatus: 'pending' | 'error' | 'success';
  onRetry?: () => void;
  onResetFilter?: () => void;
  onDetailClick?: (jobId: number, jobType: string) => void;
  onRetryClick?: (jobId: number, jobType: string) => void;
  highlightedJobId?: number | null;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
}

function pickTime(job: JobItem): string {
  if (job.status === 'PENDING') return job.scheduledAt || job.createdAt;
  if (job.status === 'FAILED' || job.status === 'INVALID') {
    return job.finishedAt || job.createdAt;
  }
  return job.createdAt;
}

export function JobsTableView({
  status,
  typeFilter,
  jobs,
  queryStatus,
  onRetry,
  onResetFilter,
  onDetailClick,
  onRetryClick,
  highlightedJobId,
  loadMoreRef,
}: JobsTableViewProps) {
  const copy = STATUS_COPY[status];

  return (
    <div className="flex flex-col max-h-[600px]">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
        {queryStatus === 'pending' && (
          <div className="flex flex-1 justify-center items-center py-8 text-gray-400">
            불러오는 중입니다...
          </div>
        )}

        {queryStatus === 'error' && (
          <div className="flex flex-1 justify-center items-center py-8 text-red-500">
            데이터 조회 중 오류가 발생했습니다
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                className="ml-4"
                onClick={onRetry}
              >
                재시도
              </Button>
            )}
          </div>
        )}

        {queryStatus === 'success' && (!jobs || jobs.length === 0) && (
          <div className="flex flex-1 flex-col justify-center items-center py-8 text-gray-400">
            <span>{copy.emptyMessage}</span>
            {typeFilter !== '전체' && onResetFilter && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={onResetFilter}
              >
                필터 초기화
              </Button>
            )}
          </div>
        )}

        {queryStatus === 'success' && jobs && jobs.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-white">
                  <TableHead>요청 ID</TableHead>
                  <TableHead>요청 타입</TableHead>
                  <TableHead>요청자 ID</TableHead>
                  <TableHead>생성 시간</TableHead>
                  <TableHead>최근 시각</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-24">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false} mode="popLayout">
                  {jobs.map((request) => {
                    const isInvalid = request.status === 'INVALID';
                    const isFailed = request.status === 'FAILED';
                    const highlighted = highlightedJobId === request.id;
                    return (
                      <MotionTableRow
                        key={`${request.id}-${request.status}`}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -40, scaleY: 0 }}
                        transition={{
                          duration: 0.45,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{ originY: 0, originX: 0 }}
                        className={`transition-colors duration-700 ${
                          highlighted ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <TableCell className="font-medium">
                          {request.id}
                        </TableCell>
                        <TableCell>{request.jobType}</TableCell>
                        <TableCell>{request.memberId}</TableCell>
                        <TableCell>{request.createdAt}</TableCell>
                        <TableCell>{pickTime(request)}</TableCell>
                        <TableCell>
                          <Badge
                            className={`transition-[background-color,color] duration-700 ease-out ${
                              REQUEST_STATUS_CONFIG[
                                request.status as keyof typeof REQUEST_STATUS_CONFIG
                              ].color
                            }`}
                          >
                            {
                              REQUEST_STATUS_CONFIG[
                                request.status as keyof typeof REQUEST_STATUS_CONFIG
                              ].label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isInvalid && onDetailClick ? (
                            <Button
                              size="sm"
                              className="rounded-full px-2 h-5 py-0 text-xs leading-none bg-gray-400 opacity-80 text-white cursor-pointer"
                              onClick={() =>
                                onDetailClick(request.id, request.jobType)
                              }
                            >
                              상세보기
                            </Button>
                          ) : isFailed && onRetryClick ? (
                            <Button
                              size="sm"
                              variant="default"
                              className="rounded-full px-2 h-5 py-0 text-xs leading-none cursor-pointer"
                              onClick={() =>
                                onRetryClick(request.id, request.jobType)
                              }
                            >
                              재시도
                            </Button>
                          ) : null}
                        </TableCell>
                      </MotionTableRow>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
            {loadMoreRef && <div ref={loadMoreRef} className="h-4" />}
          </>
        )}
      </div>
    </div>
  );
}
