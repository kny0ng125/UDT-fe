import type { ContentCreateUpdate } from '@type/admin/Content';
import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * INVALID 작업 재제출 API — 검증 실패 필드를 고친 입력값으로 다시 처리한다.
 * 다시 검증에 실패하면 400 VALIDATION_ERROR (errors 에 필드별 사유).
 */
export const postResubmitRegisterJob = (
  jobId: number,
  data: ContentCreateUpdate,
) =>
  axiosInstance.post<{ registerJobId: number }>(
    `/api/admin/content-jobs/register/${jobId}/resubmit`,
    data,
  );

export const postResubmitUpdateJob = (
  jobId: number,
  data: ContentCreateUpdate,
) =>
  axiosInstance.post<{ updateJobId: number }>(
    `/api/admin/content-jobs/update/${jobId}/resubmit`,
    data,
  );

export const postResubmitDeleteJob = (jobId: number, contentId: number) =>
  axiosInstance.post<{ deleteJobId: number }>(
    `/api/admin/content-jobs/delete/${jobId}/resubmit`,
    { contentId },
  );
