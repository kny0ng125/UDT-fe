import { ContentCreateUpdate } from '@type/admin/Content';
import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * 콘텐츠 수정 API
 * @param contentId - 수정할 콘텐츠 ID
 * @param data - 수정할 콘텐츠 데이터
 * @returns 추적용 updateJobId (즉시 처리)
 */
export const patchContent = (contentId: number, data: ContentCreateUpdate) => {
  return axiosInstance.post<{ updateJobId: number }>(
    `/api/admin/contents/${contentId}/update`,
    data,
  );
};
