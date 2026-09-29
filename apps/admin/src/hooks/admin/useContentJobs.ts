import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getContentJobs } from '@lib/apis/admin/getContentJobs';
import { getContentJobDetail } from '@lib/apis/admin/getContentJobDetail';
import {
  postRetryAllFailedContentJobs,
  postRetryContentJob,
} from '@lib/apis/admin/postRetryContentJob';
import {
  postResubmitDeleteJob,
  postResubmitRegisterJob,
  postResubmitUpdateJob,
} from '@lib/apis/admin/postResubmitContentJob';
import type { ContentCreateUpdate } from '@type/admin/Content';
import type {
  ContentJobFilterType,
  ContentJobListResponse,
  ContentJobType,
} from '@type/admin/ContentJob';
import { showSimpleToast } from '@udt/ui/common/Toast';

export const CONTENT_JOBS_KEY = 'adminContentJobs';
export const CONTENT_JOB_DETAIL_KEY = 'adminContentJobDetail';

const PAGE_SIZE = 20; // 백엔드 @Max(20)

/** 모니터 화면 폴링 주기. 스트리밍 전환 후 작업은 요청 즉시 끝나므로 짧게 둔다. */
export const CONTENT_JOBS_POLL_MS = 5000;

// 상태별 작업 목록 (무한 스크롤)
export const useInfiniteContentJobs = (
  type: ContentJobFilterType,
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) =>
  useInfiniteQuery<
    ContentJobListResponse,
    unknown,
    InfiniteData<ContentJobListResponse>,
    [string, ContentJobFilterType],
    string | null
  >({
    queryKey: [CONTENT_JOBS_KEY, type],
    queryFn: ({ pageParam = null }) =>
      getContentJobs({ type, cursor: pageParam, size: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    initialPageParam: null,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? false,
  });

// 작업 상세 (제출 입력값 + 검증 실패 목록)
export const useContentJobDetail = (jobType?: ContentJobType, jobId?: number) =>
  useQuery({
    queryKey: [CONTENT_JOB_DETAIL_KEY, jobType, jobId],
    queryFn: () => getContentJobDetail(jobType!, jobId!),
    enabled: !!jobType && !!jobId,
  });

const useInvalidateJobs = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [CONTENT_JOBS_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTENT_JOB_DETAIL_KEY] });
    // 재처리가 성공하면 콘텐츠 목록도 바뀐다
    queryClient.invalidateQueries({ queryKey: ['infiniteAdminContentList'] });
  };
};

// FAILED 단건 재시도
export const useRetryContentJob = () => {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: ({
      jobType,
      jobId,
    }: {
      jobType: ContentJobType;
      jobId: number;
    }) => postRetryContentJob(jobType, jobId),
    onSuccess: (_data, { jobId }) => {
      invalidate();
      showSimpleToast.success({
        message: `요청 #${jobId} 재시도를 요청했습니다.`,
        position: 'top-center',
      });
    },
  });
};

// FAILED 전체 재시도
export const useRetryAllFailedContentJobs = () => {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: () => postRetryAllFailedContentJobs(),
    onSuccess: () => {
      invalidate();
      showSimpleToast.success({
        message: '실패한 요청 전체 재시도를 요청했습니다.',
        position: 'top-center',
      });
    },
  });
};

export type ResubmitVariables =
  | { jobType: 'REGISTER' | 'UPDATE'; jobId: number; data: ContentCreateUpdate }
  | { jobType: 'DELETE'; jobId: number; contentId: number };

// INVALID 재제출 (수정한 입력값으로)
export const useResubmitContentJob = () => {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: async (vars: ResubmitVariables): Promise<void> => {
      switch (vars.jobType) {
        case 'REGISTER':
          await postResubmitRegisterJob(vars.jobId, vars.data);
          return;
        case 'UPDATE':
          await postResubmitUpdateJob(vars.jobId, vars.data);
          return;
        case 'DELETE':
          await postResubmitDeleteJob(vars.jobId, vars.contentId);
          return;
      }
    },
    onSuccess: (_data, { jobId }) => {
      invalidate();
      showSimpleToast.success({
        message: `요청 #${jobId} 재제출이 처리되었습니다.`,
        position: 'top-center',
      });
    },
  });
};
