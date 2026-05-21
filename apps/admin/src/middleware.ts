import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, reissueToken } from '@udt/shared/auth';

/* -------------------------------------------------------------------------- */
/* 정책                                                                       */
/* -------------------------------------------------------------------------- */
// 백엔드(TokenProvider)가 RS256 + admin 토큰에 aud="admin"으로 서명함.
const JWT_AUDIENCE = 'admin';
const REISSUE_ENDPOINT = '/api/admin/reissue/token';

/* -------------------------------------------------------------------------- */
/* 미들웨어                                                                   */
/* -------------------------------------------------------------------------- */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('Authorization')?.value;

  /* -------- /signin → /login 리다이렉트 -------- */
  if (pathname === '/signin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------- /login 페이지 특별 처리 (무한루프 방지) -------- */
  if (pathname === '/login') {
    if (token) {
      console.log('⚠️ 로그인 페이지에서 토큰 발견 - 쿠키 삭제');
      const response = NextResponse.next();
      response.cookies.delete('Authorization');
      response.headers.set(
        'Set-Cookie',
        'Authorization=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      );
      return response;
    }
    return NextResponse.next();
  }

  /* -------- 토큰이 없는 경우 /login으로 리다이렉트 -------- */
  if (!token) {
    console.log(`🔒 토큰 없음 → /login으로 리다이렉트 (${pathname})`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------- 토큰 검증 -------- */
  const verification = await verifyToken(token, { audience: JWT_AUDIENCE });

  if (verification.payload) {
    if (verification.payload.ROLE !== 'ROLE_ADMIN') {
      console.log(`❌ 권한 없음: ${verification.payload.ROLE} → /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log(`✅ 유효한 관리자 토큰 - 접근 허용 (${pathname})`);
    return NextResponse.next();
  }

  if (verification.isExpired) {
    console.log(`⏰ 토큰 만료 - 재발급 시도 (${pathname})`);

    const { ok, setCookie } = await reissueToken(request, {
      endpoint: REISSUE_ENDPOINT,
      maxRetries: 3,
    });

    if (ok) {
      console.log('✅ 재발급 성공 - 원래 페이지로 리다이렉트');
      const response = NextResponse.redirect(new URL(pathname, request.url));
      if (setCookie) {
        response.headers.set('set-cookie', setCookie);
      }
      return response;
    }

    console.log('❌ 재발급 실패 - /login으로 리다이렉트');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log(`❌ 무효한 토큰 - /login으로 리다이렉트 (${pathname})`);
  return NextResponse.redirect(new URL('/login', request.url));
}

/* -------------------------------------------------------------------------- */
export const config = {
  matcher: ['/((?!api|_next|favicon.ico|fonts|images|icons|preview).*)'],
};
