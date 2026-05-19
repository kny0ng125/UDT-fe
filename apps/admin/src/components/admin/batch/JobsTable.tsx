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
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BatchJobDetailDialog } from '@components/admin/batch/BatchJobDetailDialog';
import { useGetBatchJobList } from '@hooks/admin/useGetBatchJobList';
import { useQueryErrorToast } from '@udt/shared/hooks/useQueryErrorToast';
import {
  requestTypeConfigInBatchJobList,
  type GetBatchJobListResponse,
} from '@type/admin/batch';

const MotionTableRow = motion.create(TableRow);

type MonitorStatus = 'PENDING' | 'FAILED' | 'INVALID';
type MonitorFilter = MonitorStatus | 'ALL';

type JobItem = GetBatchJobListResponse['item'][number];

const STATUS_COPY: Record<
  MonitorFilter,
  { errorToast: string; emptyMessage: string }
> = {
  PENDING: {
    errorToast: '대기 중 배치 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '대기 중 배치가 없습니다.',
  },
  FAILED: {
    errorToast: '실패한 배치 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '실패한 배치가 없습니다.',
  },
  INVALID: {
    errorToast: '무효화된 배치 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '무효화된 배치가 없습니다.',
  },
  ALL: {
    errorToast: '배치 목록 조회 중 오류가 발생했습니다.',
    emptyMessage: '조건에 맞는 배치가 없습니다.',
  },
};

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

// 행 status에 따라 표시할 시각 값을 결정.
// PENDING: scheduledAt(수행 예정), FAILED/INVALID: finishedAt(완료/실패), 그 외: createdAt.
function pickTime(job: JobItem): string {
  if (job.status === 'PENDING') return job.scheduledAt || job.createdAt;
  if (job.status === 'FAILED' || job.status === 'INVALID') {
    return job.finishedAt || job.createdAt;
  }
  return job.createdAt;
}

// 순수 표시용 컴포넌트 — 데이터/상태는 prop으로 받음. 테스트/프리뷰에서 재사용.
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
                              requestTypeConfigInBatchJobList[
                                request.status as keyof typeof requestTypeConfigInBatchJobList
                              ].color
                            }`}
                          >
                            {
                              requestTypeConfigInBatchJobList[
                                request.status as keyof typeof requestTypeConfigInBatchJobList
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

interface JobsTableProps {
  status: MonitorStatus;
  typeFilter: string;
  onResetFilter?: () => void;
}

export function JobsTable({
  status,
  typeFilter,
  onResetFilter,
}: JobsTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number>(-1);
  const [selectedJobType, setSelectedJobType] = useState<string>('REGISTER');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const copy = STATUS_COPY[status];

  const batchJobListQuery = useGetBatchJobList({ type: status });
  useQueryErrorToast(batchJobListQuery, copy.errorToast);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = batchJobListQuery;

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredJobs = useMemo(() => {
    return data?.pages
      .flatMap((page) => page.item)
      .filter((req) => typeFilter === '전체' || req.jobType === typeFilter);
  }, [typeFilter, data]);

  const handleDetailClick = (requestId: number, jobType: string) => {
    setIsDialogOpen(true);
    setSelectedJobId(requestId);
    setSelectedJobType(jobType);
  };

  return (
    <>
      <JobsTableView
        status={status}
        typeFilter={typeFilter}
        jobs={filteredJobs}
        queryStatus={queryStatus}
        onRetry={() => batchJobListQuery.refetch()}
        onResetFilter={onResetFilter}
        onDetailClick={handleDetailClick}
        loadMoreRef={loadMoreRef}
      />

      {isDialogOpen && (
        <BatchJobDetailDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedJobId(-1);
              setSelectedJobType('전체');
            }
          }}
          jobId={selectedJobId}
          jobType={selectedJobType}
        />
      )}
    </>
  );
}

export type { MonitorStatus, JobItem };
