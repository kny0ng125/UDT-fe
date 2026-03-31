import { AxiosError } from 'axios';
import { getErrorMessage } from '../../utils/getErrorMessage';

function createAxiosError(status?: number, message = ''): AxiosError {
  const error = new AxiosError(message);
  if (status !== undefined) {
    error.response = {
      status,
      data: {},
      headers: {},
      statusText: '',
      config: {} as any,
    };
  }
  return error;
}

describe('getErrorMessage', () => {
  it('should return message for 400', () => {
    expect(getErrorMessage(createAxiosError(400))).toBe('잘못된 요청입니다.');
  });

  it('should return message for 401', () => {
    expect(getErrorMessage(createAxiosError(401))).toBe(
      '로그인이 만료되었습니다. 다시 로그인 해주세요.',
    );
  });

  it('should return message for 403', () => {
    expect(getErrorMessage(createAxiosError(403))).toBe('권한이 없습니다.');
  });

  it('should return message for 404', () => {
    expect(getErrorMessage(createAxiosError(404))).toBe(
      '존재하지 않는 리소스입니다.',
    );
  });

  it('should return message for 409', () => {
    expect(getErrorMessage(createAxiosError(409))).toBe('중복된 요청입니다.');
  });

  it('should return message for 500', () => {
    expect(getErrorMessage(createAxiosError(500))).toBe(
      '서버 오류가 발생했습니다. 운영팀에 문의 바랍니다.',
    );
  });

  it('should return error.message for unknown status', () => {
    expect(getErrorMessage(createAxiosError(418, 'teapot'))).toBe('teapot');
  });

  it('should return fallback for unknown status with no message', () => {
    expect(getErrorMessage(createAxiosError(undefined, ''))).toBe(
      '예상치 못한 오류가 발생했습니다.',
    );
  });
});
