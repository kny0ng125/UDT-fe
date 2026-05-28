import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, reissueToken } from '@udt/shared/auth';
import {
  ALLOWED_ROLES,
  addMessageToUrl,
  getDefaultPath,
  hasPermission,
} from '@lib/middleware-helpers';

// 백엔드(TokenProvider)가 RS256 + web 토큰에 aud="web"으로 서명함.
const JWT_AUDIENCE = 'web';
const REISSUE_ENDPOINT = '/api/auth/reissue/token';

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
