import {
  hasPermission,
  isValidRole,
  getDefaultPath,
  addMessageToUrl,
} from '@lib/middleware-helpers';

describe('Role 기반 Permission', () => {
  describe('hasPermission', () => {
    test('ROLE_GUEST는 /survey에 접근 가능 (H1)', () => {
      expect(hasPermission('ROLE_GUEST', '/survey')).toBe(true);
    });

    test('ROLE_GUEST는 /survey 하위 경로에도 접근 가능 (H2)', () => {
      expect(hasPermission('ROLE_GUEST', '/survey/anything')).toBe(true);
    });

    test('ROLE_GUEST는 허용되지 않은 경로 접근 불가 (H3)', () => {
      expect(hasPermission('ROLE_GUEST', '/recommend')).toBe(false);
    });

    test('ROLE_USER는 일반 경로(/recommend)에 접근 가능 (H4)', () => {
      expect(hasPermission('ROLE_USER', '/recommend')).toBe(true);
    });

    test('ROLE_USER는 /survey에 접근 불가 (H5: denied)', () => {
      expect(hasPermission('ROLE_USER', '/survey')).toBe(false);
    });

    test('ROLE_USER는 /survey 하위 경로도 접근 불가 (H6: startsWith deny)', () => {
      expect(hasPermission('ROLE_USER', '/survey/extra')).toBe(false);
    });

    test.each([
      ['ROLE_ADMIN', '/recommend'],
      ['', '/recommend'],
    ])('유효하지 않은 role(%s)은 접근 불가 (H7)', (role, path) => {
      expect(hasPermission(role, path)).toBe(false);
    });
  });

  describe('isValidRole', () => {
    test('ROLE_USER는 유효한 role (V1)', () => {
      expect(isValidRole('ROLE_USER')).toBe(true);
    });

    test('ROLE_GUEST는 유효한 role (V2)', () => {
      expect(isValidRole('ROLE_GUEST')).toBe(true);
    });

    test('ROLE_ADMIN은 유효하지 않음 (V3)', () => {
      expect(isValidRole('ROLE_ADMIN')).toBe(false);
    });

    test.each(['', 'role_user', 'ROLE_user', 'guest'])(
      '빈 문자열/대소문자 변형 "%s"은 유효하지 않음 (V4)',
      (input) => {
        expect(isValidRole(input)).toBe(false);
      },
    );
  });
});

describe('Default Path 전환 (getDefaultPath)', () => {
  test('ROLE_GUEST → /survey (D1)', () => {
    expect(getDefaultPath('ROLE_GUEST')).toBe('/survey');
  });

  test('ROLE_USER → /recommend (D2)', () => {
    expect(getDefaultPath('ROLE_USER')).toBe('/recommend');
  });

  test.each(['ROLE_ADMIN', '', 'unknown'])(
    '알 수 없는 role "%s" → / (D3)',
    (role) => {
      expect(getDefaultPath(role)).toBe('/');
    },
  );
});

describe('Message to URL (addMessageToUrl)', () => {
  const buildUrl = () => new URL('https://example.com/path');

  test('auth_msg와 auth_text 쿼리 파라미터가 set됨 (A1)', () => {
    const url = buildUrl();
    addMessageToUrl(url, 'auth-required', 'login needed');

    expect(url.searchParams.get('auth_msg')).toBe('auth-required');
    expect(url.searchParams.get('auth_text')).not.toBeNull();
  });

  test('한글 메시지가 Base64로 round-trip 가능 (A2)', () => {
    const url = buildUrl();
    const original = '로그인이 필요합니다.';

    addMessageToUrl(url, 'auth-required', original);
    const encoded = url.searchParams.get('auth_text');
    const decoded = Buffer.from(encoded ?? '', 'base64').toString('utf-8');

    expect(decoded).toBe(original);
  });

  test('기존 쿼리 파라미터를 보존 (A3)', () => {
    const url = new URL('https://example.com/path?foo=bar&baz=qux');

    addMessageToUrl(url, 'auth-required', 'msg');

    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('baz')).toBe('qux');
    expect(url.searchParams.get('auth_msg')).toBe('auth-required');
  });

  test('빈 메시지도 인코딩되어 set됨 (A4)', () => {
    const url = buildUrl();

    addMessageToUrl(url, 'noop', '');
    const encoded = url.searchParams.get('auth_text');

    expect(encoded).not.toBeNull();
    expect(Buffer.from(encoded ?? '', 'base64').toString('utf-8')).toBe('');
  });
});
