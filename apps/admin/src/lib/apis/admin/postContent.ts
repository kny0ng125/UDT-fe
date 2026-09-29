import { ContentCreateUpdate } from '@type/admin/Content';
import axiosInstance from '@udt/shared/apis/axiosInstance';

/**
 * 콘텐츠 등록 API
 * @param data - 등록할 콘텐츠 정보
 * 백엔드가 즉시 처리(스트리밍)한 뒤 추적용 registerJobId 를 반환한다.
 * 입력 검증 실패 시 400 VALIDATION_ERROR, 처리 실패 시 500 STREAMING_FAILURE.
 */
export const postContent = (data: ContentCreateUpdate) =>
  axiosInstance.post<{ registerJobId: number }>('/api/admin/contents', data);
