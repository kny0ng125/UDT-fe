import { AxiosError } from 'axios';

// 재시도 API 의 409 는 "중복된 요청"이 아니라 아래 두 경우다(백엔드 StreamingErrorCode).
// 공통 토스트가 409 를 전부 "중복된 요청입니다."로 보여 주므로, 원인에 맞는 문구로 바꿔 준다.
// 해당하지 않으면 undefined 를 돌려 공통 문구를 그대로 쓴다.
export function retryErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof AxiosError) || error.response?.status !== 409) {
    return undefined;
  }
  const code = (error.response.data as { code?: string } | undefined)?.code;
  switch (code) {
    case 'JOB_RETRY_LIMIT_EXCEEDED':
      return '재시도 한도(3회)를 초과했어요. 같은 오류가 반복되면 운영팀에 문의해 주세요.';
    case 'JOB_NOT_FAILED':
      return '이미 처리되었거나 실패 상태가 아닌 요청이에요. 목록을 확인해 주세요.';
    default:
      return undefined;
  }
}
