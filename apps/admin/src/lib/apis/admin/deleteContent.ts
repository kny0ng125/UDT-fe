import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * 콘텐츠 삭제 API
 * @param contentId - 삭제할 콘텐츠 ID
 * @returns 추적용 deleteJobId (즉시 처리)
 */
export const deleteContent = (contentId: number) =>
  axiosInstance.post<{ deleteJobId: number }>(
    `/api/admin/contents/${contentId}/delete`,
  );
