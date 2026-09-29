import type { ContentJobDetail, ContentJobType } from '@type/admin/ContentJob';
import axiosInstance from '@udt/shared/apis/axiosInstance';

const PATH_BY_TYPE: Record<ContentJobType, string> = {
  REGISTER: 'register',
  UPDATE: 'update',
  DELETE: 'delete',
};

/**
 * 콘텐츠 작업 상세 조회 API — 제출 입력값, 검증 실패 목록(validationErrors), 에러 메시지
 */
export const getContentJobDetail = async (
  jobType: ContentJobType,
  jobId: number,
): Promise<ContentJobDetail> => {
  const response = await axiosInstance.get<ContentJobDetail>(
    `/api/admin/content-jobs/${PATH_BY_TYPE[jobType]}/${jobId}`,
  );
  return response.data;
};

export { PATH_BY_TYPE as CONTENT_JOB_PATH_BY_TYPE };
