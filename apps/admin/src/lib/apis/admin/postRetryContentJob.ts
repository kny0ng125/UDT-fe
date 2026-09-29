import type { ContentJobType } from '@type/admin/ContentJob';
import axiosInstance from '@udt/shared/apis/axiosInstance';
import { CONTENT_JOB_PATH_BY_TYPE } from '@lib/apis/admin/getContentJobDetail';

/**
 * FAILED 작업 단건 재시도 API — 저장된 입력값으로 다시 처리한다.
 */
export const postRetryContentJob = (jobType: ContentJobType, jobId: number) =>
  axiosInstance.post<void>(
    `/api/admin/content-jobs/${CONTENT_JOB_PATH_BY_TYPE[jobType]}/${jobId}/retry`,
  );

/**
 * FAILED 작업 전체 재시도 API
 */
export const postRetryAllFailedContentJobs = () =>
  axiosInstance.post<void>('/api/admin/content-jobs/retry');
