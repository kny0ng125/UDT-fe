import type {
  ContentJobListParams,
  ContentJobListResponse,
} from '@type/admin/ContentJob';
import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * 콘텐츠 작업(등록/수정/삭제) 목록 조회 API — 상태별, 커서 기반
 * @param params - type(PENDING|FAILED|INVALID), cursor, size(1~20)
 */
export const getContentJobs = async (
  params: ContentJobListParams,
): Promise<ContentJobListResponse> => {
  const response = await axiosInstance.get<ContentJobListResponse>(
    '/api/admin/content-jobs',
    { params },
  );
  return response.data;
};
