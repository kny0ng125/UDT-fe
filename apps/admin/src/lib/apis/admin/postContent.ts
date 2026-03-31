import { ContentCreateUpdate } from '@type/admin/Content';
import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * 콘텐츠 등록 API
 * @param data - 등록할 콘텐츠 정보
 * @returns 등록 예정 콘텐츠 registerJobId 반환
 */
export const postContent = (data: ContentCreateUpdate) =>
  axiosInstance.post<{ registerJobId: number }>(
    '/api/admin/contents/registerjob',
    data,
  );
