'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Button } from '@udt/ui/components/button';
import { JobTypeDropdown } from '@components/batch/JobTypeDropDown';
import {
  JobsTableView,
  jobKey,
  type JobItem,
  type MonitorStatus,
} from '@components/batch/JobsTable';
import {
  JobResubmitDialog,
  type ResubmitTarget,
} from '@components/batch/JobResubmitDialog';
import {
  CONTENT_JOBS_POLL_MS,
  useInfiniteContentJobs,
  useRetryAllFailedContentJobs,
  useRetryContentJob,
} from '@hooks/admin/useContentJobs';
import { useMutationErrorToast } from '@udt/shared/hooks/useMutationErrorToast';
import type { ContentJobType } from '@type/admin/ContentJob';
import { retryErrorMessage } from '@utils/admin/retryErrorMessage';

type FilterValue = MonitorStatus | 'ALL';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기 중' },
  { value: 'FAILED', label: '실패' },
  { value: 'INVALID', label: '무효' },
];

const TITLE_BY_FILTER: Record<FilterValue, string> = {
  ALL: '전체 요청',
  PENDING: '대기 중 요청',
  FAILED: '실패한 요청',
  INVALID: '무효화된 요청',
};

const HIGHLIGHT_MS = 1500;

export function JobMonitor() {
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [resubmitTarget, setResubmitTarget] = useState<ResubmitTarget | null>(
    null,
  );

  // 상태별 목록. 백엔드는 type 이 필수라 '전체'는 세 목록을 합쳐 보여 준다.
  const poll = { refetchInterval: CONTENT_JOBS_POLL_MS };
  const pendingQ = useInfiniteContentJobs('PENDING', {
    ...poll,
    enabled: filter === 'ALL' || filter === 'PENDING',
  });
  const failedQ = useInfiniteContentJobs('FAILED', {
    ...poll,
    enabled: filter === 'ALL' || filter === 'FAILED',
  });
  const invalidQ = useInfiniteContentJobs('INVALID', {
    ...poll,
    enabled: filter === 'ALL' || filter === 'INVALID',
  });

  const byFilter = {
    PENDING: pendingQ,
    FAILED: failedQ,
    INVALID: invalidQ,
  } as const;
  const activeQueries =
    filter === 'ALL' ? [pendingQ, failedQ, invalidQ] : [byFilter[filter]];

  // 데이터가 바뀔 때만 다시 계산 (쿼리 객체는 렌더마다 새로 만들어진다)
  const pendingData = pendingQ.data;
  const failedData = failedQ.data;
  const invalidData = invalidQ.data;
  const jobs = useMemo<JobItem[]>(() => {
    const sources =
      filter === 'ALL'
        ? [pendingData, failedData, invalidData]
        : [
            { PENDING: pendingData, FAILED: failedData, INVALID: invalidData }[
              filter
            ],
          ];
    const seen = new Set<string>();
    const merged: JobItem[] = [];
    for (const data of sources) {
      for (const page of data?.pages ?? []) {
        for (const job of page.item) {
          const k = jobKey(job);
          if (seen.has(k)) continue; // 폴링 중 상태가 바뀌어 두 목록에 걸친 경우
          seen.add(k);
          merged.push(job);
        }
      }
    }
    // 최신순 (ISO 문자열이라 사전순 = 시간순)
    return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter, pendingData, failedData, invalidData]);

  const queryStatus: 'pending' | 'error' | 'success' = activeQueries.some(
    (q) => q.isError,
  )
    ? 'error'
    : activeQueries.some((q) => q.isPending)
      ? 'pending'
      : 'success';

  // 새로 나타나거나 상태가 바뀐 행을 잠깐 강조 (첫 로드는 제외)
  const [highlightedJobKey, setHighlightedJobKey] = useState<string | null>(
    null,
  );
  const prevStatusRef = useRef<Map<string, string> | null>(null);
  const prevFilterRef = useRef<FilterValue>(filter);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (queryStatus !== 'success') return;
    const current = new Map(jobs.map((j) => [jobKey(j), j.status]));
    // 필터를 바꾼 직후는 비교 기준만 새로 잡는다 (필터 전환을 '변경'으로 강조하지 않게)
    const prev =
      prevFilterRef.current === filter ? prevStatusRef.current : null;
    prevFilterRef.current = filter;
    prevStatusRef.current = current;
    if (!prev) return;
    const changed = jobs.find((j) => prev.get(jobKey(j)) !== j.status);
    if (!changed) return;
    setHighlightedJobKey(jobKey(changed));
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(
      () => setHighlightedJobKey(null),
      HIGHLIGHT_MS,
    );
  }, [jobs, queryStatus, filter]);
  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  // 무한 스크롤
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasMore = activeQueries.some((q) => q.hasNextPage);
  const fetchingMore = activeQueries.some((q) => q.isFetchingNextPage);
  // 옵저버 콜백이 항상 최신 쿼리를 보도록 ref 로 전달 (쿼리 객체는 렌더마다 바뀐다)
  const activeQueriesRef = useRef(activeQueries);
  activeQueriesRef.current = activeQueries;
  useEffect(() => {
    if (!hasMore || fetchingMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      activeQueriesRef.current.forEach((q) => {
        if (q.hasNextPage) q.fetchNextPage();
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, fetchingMore, filter]);

  const retryOne = useRetryContentJob();
  const retryAll = useRetryAllFailedContentJobs();
  useMutationErrorToast(retryOne, retryErrorMessage(retryOne.error));
  useMutationErrorToast(retryAll, retryErrorMessage(retryAll.error));

  const filterLabel = FILTER_OPTIONS.find((o) => o.value === filter)!.label;
  const filterLabelOptions = FILTER_OPTIONS.map((o) => o.label);
  const labelToFilter = FILTER_OPTIONS.reduce(
    (acc, o) => {
      acc[o.label] = o.value;
      return acc;
    },
    {} as Record<string, FilterValue>,
  );

  const hasFailed = jobs.some((j) => j.status === 'FAILED');

  // 재시도 요청이 끝나고 목록이 갱신될 때까지 해당 행을 '대기중'으로 보여준다.
  const retryingKeys = useMemo(() => {
    if (retryAll.isPending) {
      return new Set(
        jobs.filter((j) => j.status === 'FAILED').map((j) => jobKey(j)),
      );
    }
    if (retryOne.isPending && retryOne.variables) {
      return new Set([
        jobKey({
          jobType: retryOne.variables.jobType,
          id: retryOne.variables.jobId,
        }),
      ]);
    }
    return new Set<string>();
  }, [jobs, retryAll.isPending, retryOne.isPending, retryOne.variables]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => retryAll.mutate()}
          disabled={
            retryAll.isPending ||
            (filter !== 'ALL' && filter !== 'FAILED') ||
            !hasFailed
          }
        >
          {retryAll.isPending ? '재시도 요청 중...' : '실패 요청 전체 재시도'}
        </Button>
      </div>

      <Card className="flex flex-col py-4 px-2">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {TITLE_BY_FILTER[filter]}
            </CardTitle>
            <JobTypeDropdown
              options={filterLabelOptions}
              value={filterLabel}
              onChange={(label) => {
                const next = labelToFilter[label];
                if (next) setFilter(next);
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <JobsTableView
            status={filter}
            typeFilter={filter === 'ALL' ? '전체' : filterLabel}
            jobs={jobs}
            queryStatus={queryStatus}
            onRetry={() => activeQueries.forEach((q) => q.refetch())}
            onResetFilter={() => setFilter('ALL')}
            retryingKeys={retryingKeys}
            highlightedJobKey={highlightedJobKey}
            loadMoreRef={loadMoreRef}
            onDetailClick={(jobId, jobType) =>
              setResubmitTarget({ jobId, jobType: jobType as ContentJobType })
            }
            onRetryClick={(jobId, jobType) => {
              if (retryOne.isPending) return;
              retryOne.mutate({ jobId, jobType: jobType as ContentJobType });
            }}
          />
        </CardContent>
      </Card>

      <JobResubmitDialog
        target={resubmitTarget}
        onClose={() => setResubmitTarget(null)}
      />
    </div>
  );
}
