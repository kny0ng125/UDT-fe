'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Button } from '@udt/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@udt/ui/components/dialog';
import { JobTypeDropdown } from '@components/batch/JobTypeDropDown';
import {
  JobsTableView,
  type JobItem,
  type MonitorStatus,
} from '@components/batch/JobsTable';
import ContentForm from '@components/ContentForm';
import type {
  ContentWithoutId,
  ContentCreateUpdate,
} from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';
import { showSimpleToast } from '@udt/ui/common/Toast';

// TODO(stream): 백엔드 스트림 API 연결 시 MOCK_DATA + 시뮬레이션 제거하고
// useGetRequestList 같은 hook으로 교체

const MOCK_DATA: Record<MonitorStatus, JobItem[]> = {
  PENDING: [
    {
      id: 1044,
      status: 'PENDING',
      memberId: 12,
      createdAt: '2026-05-14 10:22:30',
      updateAt: '2026-05-14 10:22:30',
      scheduledAt: '2026-05-14 10:22:32',
      jobType: 'REGISTER',
    },
    {
      id: 1043,
      status: 'PENDING',
      memberId: 11,
      createdAt: '2026-05-14 10:21:50',
      updateAt: '2026-05-14 10:21:50',
      scheduledAt: '2026-05-14 10:21:52',
      jobType: 'UPDATE',
    },
    {
      id: 1042,
      status: 'PENDING',
      memberId: 11,
      createdAt: '2026-05-14 10:21:08',
      updateAt: '2026-05-14 10:21:08',
      scheduledAt: '2026-05-14 10:21:10',
      jobType: 'REGISTER',
    },
    {
      id: 1041,
      status: 'PENDING',
      memberId: 11,
      createdAt: '2026-05-14 10:20:55',
      updateAt: '2026-05-14 10:20:55',
      scheduledAt: '2026-05-14 10:20:57',
      jobType: 'UPDATE',
    },
    {
      id: 1037,
      status: 'PENDING',
      memberId: 14,
      createdAt: '2026-05-14 10:18:31',
      updateAt: '2026-05-14 10:18:31',
      scheduledAt: '2026-05-14 10:18:33',
      jobType: 'DELETE',
    },
  ],
  FAILED: [
    {
      id: 1031,
      status: 'FAILED',
      memberId: 14,
      createdAt: '2026-05-14 09:51:02',
      updateAt: '2026-05-14 09:51:09',
      scheduledAt: '2026-05-14 09:51:02',
      finishedAt: '2026-05-14 09:51:09',
      jobType: 'REGISTER',
    },
    {
      id: 1025,
      status: 'FAILED',
      memberId: 11,
      createdAt: '2026-05-14 09:42:18',
      updateAt: '2026-05-14 09:42:22',
      scheduledAt: '2026-05-14 09:42:18',
      finishedAt: '2026-05-14 09:42:22',
      jobType: 'UPDATE',
    },
    {
      id: 1018,
      status: 'FAILED',
      memberId: 11,
      createdAt: '2026-05-14 09:31:44',
      updateAt: '2026-05-14 09:31:46',
      scheduledAt: '2026-05-14 09:31:44',
      finishedAt: '2026-05-14 09:31:46',
      jobType: 'DELETE',
    },
    {
      id: 1011,
      status: 'FAILED',
      memberId: 12,
      createdAt: '2026-05-14 09:20:01',
      updateAt: '2026-05-14 09:20:06',
      scheduledAt: '2026-05-14 09:20:01',
      finishedAt: '2026-05-14 09:20:06',
      jobType: 'REGISTER',
    },
  ],
  INVALID: [
    {
      id: 989,
      status: 'INVALID',
      memberId: 14,
      createdAt: '2026-05-14 08:55:11',
      updateAt: '2026-05-14 08:55:12',
      scheduledAt: '2026-05-14 08:55:11',
      finishedAt: '2026-05-14 08:55:12',
      jobType: 'REGISTER',
    },
    {
      id: 976,
      status: 'INVALID',
      memberId: 11,
      createdAt: '2026-05-14 08:40:24',
      updateAt: '2026-05-14 08:40:25',
      scheduledAt: '2026-05-14 08:40:24',
      finishedAt: '2026-05-14 08:40:25',
      jobType: 'UPDATE',
    },
  ],
};

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

const MOCK_PREFILLED_CONTENT: ContentWithoutId = {
  title: '베놈: 라스트 댄스',
  description: '베놈 시리즈의 마지막 챕터.',
  posterUrl: 'https://cdn.example.com/posters/venom-last.png',
  backdropUrl: '',
  trailerUrl: 'not-a-valid-url',
  openDate: '2026-04-12',
  runningTime: 109,
  episode: 0,
  rating: '15세',
  categories: [{ categoryType: '영화', genres: ['액션', 'SF'] }],
  countries: ['미국'],
  directors: [],
  casts: [],
  platforms: [
    { platformType: 'NETFLIX', watchUrl: 'https://watch.netflix.com/abc' },
    { platformType: 'DISNEY_PLUS', watchUrl: 'invalid url here' },
  ],
};

const MOCK_VALIDATION_ERRORS: JobValidationError[] = [
  {
    field: 'trailerUrl',
    value: 'not-a-valid-url',
    code: 'INVALID_URL',
    message: '올바른 URL 형식이 아닙니다.',
  },
  {
    field: 'platforms[1].watchUrl',
    value: 'invalid url here',
    code: 'INVALID_URL',
    message: '플랫폼 시청 URL 형식이 올바르지 않습니다.',
  },
  {
    field: 'rating',
    value: '15세',
    code: 'UNKNOWN_RATING',
    message: '허용되지 않는 관람등급 코드입니다.',
  },
];

type TransitionTo = 'FAILED' | 'INVALID' | 'COMPLETED';
const PENDING_TRANSITIONS: Record<number, TransitionTo> = {
  1044: 'COMPLETED',
  1043: 'COMPLETED',
  1042: 'FAILED',
  1041: 'INVALID',
  1037: 'COMPLETED',
};

export function JobMonitor() {
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [retryFormJob, setRetryFormJob] = useState<JobItem | null>(null);

  const [jobs, setJobs] = useState<JobItem[]>(() => [
    ...MOCK_DATA.PENDING,
    ...MOCK_DATA.FAILED,
    ...MOCK_DATA.INVALID,
  ]);
  const [highlightedJobId, setHighlightedJobId] = useState<number | null>(null);
  const [simRunning, setSimRunning] = useState(true);
  const transitionIdxRef = useRef(0);

  useEffect(() => {
    if (!simRunning) return;

    const pendingIds = Object.keys(PENDING_TRANSITIONS).map(Number);
    const interval = setInterval(() => {
      const idx = transitionIdxRef.current;
      if (idx >= pendingIds.length) {
        setSimRunning(false);
        return;
      }
      const targetId = pendingIds[idx];
      const nextStatus = PENDING_TRANSITIONS[targetId];
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      if (nextStatus === 'COMPLETED') {
        setJobs((prev) => prev.filter((j) => j.id !== targetId));
      } else {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === targetId
              ? { ...j, status: nextStatus, finishedAt: now, updateAt: now }
              : j,
          ),
        );
        setHighlightedJobId(targetId);
        setTimeout(() => setHighlightedJobId(null), 1500);
      }
      transitionIdxRef.current = idx + 1;
    }, 3000);

    return () => clearInterval(interval);
  }, [simRunning]);

  const restartSimulation = () => {
    transitionIdxRef.current = 0;
    setJobs([...MOCK_DATA.PENDING, ...MOCK_DATA.FAILED, ...MOCK_DATA.INVALID]);
    setHighlightedJobId(null);
    setSimRunning(true);
  };

  const filteredJobs = useMemo(
    () => (filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)),
    [filter, jobs],
  );

  const filterLabel = FILTER_OPTIONS.find((o) => o.value === filter)!.label;
  const filterLabelOptions = FILTER_OPTIONS.map((o) => o.label);
  const labelToFilter = FILTER_OPTIONS.reduce(
    (acc, o) => {
      acc[o.label] = o.value;
      return acc;
    },
    {} as Record<string, FilterValue>,
  );

  const nextJobId = () =>
    jobs.reduce((max, j) => (j.id > max ? j.id : max), 0) + 1;

  const enqueueRetry = (original: JobItem) => {
    const newId = nextJobId();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const scheduled = new Date(Date.now() + 2000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
    const newJob: JobItem = {
      id: newId,
      status: 'PENDING',
      memberId: original.memberId,
      createdAt: now,
      updateAt: now,
      scheduledAt: scheduled,
      jobType: original.jobType,
    };
    setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== original.id)]);
    setHighlightedJobId(newId);
    setTimeout(() => setHighlightedJobId(null), 1500);
    return newId;
  };

  const handleRetrySave = (data: ContentCreateUpdate) => {
    if (!retryFormJob) return;
    const newId = enqueueRetry(retryFormJob);
    showSimpleToast.success({
      message: `요청 #${retryFormJob.id} 재제출 → 새 요청 #${newId} 생성 — ${data.title}`,
      position: 'top-center',
    });
    setRetryFormJob(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 flex items-center justify-between gap-3">
        <span>
          요청 모니터링 — 새 요청이 들어오면 3초마다 처리 결과가 갱신됩니다.
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={restartSimulation}
          disabled={simRunning}
        >
          {simRunning ? '모니터링 진행 중...' : '다시 보기'}
        </Button>
      </div>

      <Card className="flex flex-col py-4 px-2">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
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
            typeFilter="전체"
            jobs={filteredJobs}
            queryStatus="success"
            highlightedJobId={highlightedJobId}
            onDetailClick={(jobId) => {
              const job = filteredJobs.find((j) => j.id === jobId) ?? null;
              setRetryFormJob(job);
            }}
            onRetryClick={(jobId) => {
              const original = jobs.find((j) => j.id === jobId);
              if (!original) return;
              const newId = enqueueRetry(original);
              showSimpleToast.success({
                message: `요청 #${jobId} 재시도 → 새 요청 #${newId} 생성`,
                position: 'top-center',
              });
            }}
          />
        </CardContent>
      </Card>

      <Dialog
        open={retryFormJob !== null}
        onOpenChange={(open) => {
          if (!open) setRetryFormJob(null);
        }}
      >
        <DialogContent className="w-full max-w-none sm:max-w-[1000px] max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              요청 #{retryFormJob?.id} 재시도 ({retryFormJob?.jobType}) — 검증
              실패 필드를 수정한 뒤 재제출하세요
            </DialogTitle>
          </DialogHeader>
          {retryFormJob && (
            <ContentForm
              content={MOCK_PREFILLED_CONTENT}
              validationErrors={MOCK_VALIDATION_ERRORS}
              onSave={handleRetrySave}
              onCancel={() => setRetryFormJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
