import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, reissueToken } from '@udt/shared/auth';

/* -------------------------------------------------------------------------- */
/* 정책                                                                       */
/* -------------------------------------------------------------------------- */
// ADMIN 역할 제거 - ROLE_USER와 ROLE_GUEST만 허용
const ROLE_RESTRICTIONS = {
  ROLE_GUEST: {
    allowed: ['/survey'],
    denied: [],
  },
  ROLE_USER: {
    allowed: [],
    denied: ['/survey'],
  },
} as const;

const ALLOWED_ROLES = ['ROLE_USER', 'ROLE_GUEST'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// 백엔드(TokenProvider)가 RS256 + web 토큰에 aud="web"으로 서명함.
const JWT_AUDIENCE = 'web';
const REISSUE_ENDPOINT = '/api/auth/reissue/token';

/* -------------------------------------------------------------------------- */
/* 유틸 함수                                                                  */
/* -------------------------------------------------------------------------- */
function addMessageToUrl(url: URL, type: string, message: string): URL {
  const encodedMessage = Buffer.from(message, 'utf-8').toString('base64');
  url.searchParams.set('auth_msg', type);
  url.searchParams.set('auth_text', encodedMessage);
  return url;
}

function isValidRole(role: string): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole);
}

function hasPermission(role: string, pathname: string): boolean {
  if (!isValidRole(role)) return false;

  const restrictions = ROLE_RESTRICTIONS[role];

  if (role === 'ROLE_GUEST') {
    return restrictions.allowed.some((path) => pathname.startsWith(path));
  }

  if (role === 'ROLE_USER') {
    const isDenied = restrictions.denied.some((path) =>
      pathname.startsWith(path),
    );
    return !isDenied;
  }

  return false;
}

function getDefaultPath(role: string): string {
  switch (role) {
    case 'ROLE_GUEST':
      return '/survey';
    case 'ROLE_USER':
      return '/recommend';
    default:
      return '/';
  }
}

/* -------------------------------------------------------------------------- */
/* 미들웨어                                                                   */
/* -------------------------------------------------------------------------- */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* -------- 쿠키 추출 -------- */
  const token = request.cookies.get('Authorization')?.value;

  /* -------- 루트(/) 처리 -------- */
  if (pathname === '/') {
    if (!token) {
      return NextResponse.next();
    }

    const verification = await verifyToken(token, {
      audience: JWT_AUDIENCE,
      allowedRoles: ALLOWED_ROLES,
    });

    if (verification.payload) {
      const defaultPath = getDefaultPath(verification.payload.ROLE);
      return NextResponse.redirect(new URL(defaultPath, request.url));
    }

    if (verification.isExpired) {
      const { ok, setCookie } = await reissueToken(request, {
        endpoint: REISSUE_ENDPOINT,
      });

      if (ok) {
        const response = NextResponse.redirect(new URL('/', request.url));
        if (setCookie) {
          response.headers.set('set-cookie', setCookie);
        }
        return response;
      }
    }

    const response = NextResponse.next();
    response.cookies.delete('Authorization');
    return response;
  }

  /* -------- 비로그인 상태 -------- */
  if (!token) {
    const redirectUrl = addMessageToUrl(
      new URL('/', request.url),
      'auth-required',
      '로그인이 필요합니다.',
    );
    return NextResponse.redirect(redirectUrl);
  }

  /* -------- 토큰 검증 -------- */
  const verification = await verifyToken(token, {
    audience: JWT_AUDIENCE,
    allowedRoles: ALLOWED_ROLES,
  });

  if (verification.payload) {
    if (!hasPermission(verification.payload.ROLE, pathname)) {
      const defaultPath = getDefaultPath(verification.payload.ROLE);
      const redirectUrl = addMessageToUrl(
        new URL(defaultPath, request.url),
        'access-denied',
        '잘못된 접근입니다.',
      );
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (verification.isExpired) {
    const { ok, setCookie } = await reissueToken(request, {
      endpoint: REISSUE_ENDPOINT,
    });

    if (ok) {
      const response = NextResponse.redirect(new URL(pathname, request.url));
      if (setCookie) {
        response.headers.set('set-cookie', setCookie);
      }
      return response;
    }

    const response = NextResponse.redirect(
      addMessageToUrl(
        new URL('/', request.url),
        'auth-expired',
        '세션이 만료되었습니다. 다시 로그인해주세요.',
      ),
    );
    response.cookies.delete('Authorization');
    return response;
  }

  // 무효한 토큰인 경우 (허용되지 않은 역할 포함)
  const response = NextResponse.redirect(
    addMessageToUrl(
      new URL('/', request.url),
      'auth-invalid',
      '유효하지 않은 인증 정보입니다. 다시 로그인해주세요.',
    ),
  );
  response.cookies.delete('Authorization');
  return response;
}

/* -------------------------------------------------------------------------- */
export const config = {
  matcher: ['/((?!api|_next|favicon.ico|fonts|images|icons|preview|auth).*)'],
};
