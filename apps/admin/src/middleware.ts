import { NextRequest, NextResponse } from 'next/server';
import {
  jwtVerify,
  importSPKI,
  type CryptoKey,
  type JWTPayload as JoseJWTPayload,
} from 'jose';

/* -------------------------------------------------------------------------- */
/* 타입                                                                      */
/* -------------------------------------------------------------------------- */
interface CustomJWTPayload extends JoseJWTPayload {
  sub: string;
  ROLE: string;
  iat: number;
  exp: number;
}

interface TokenVerificationResult {
  payload: CustomJWTPayload | null;
  isExpired: boolean;
  isInvalid: boolean;
}

/* -------------------------------------------------------------------------- */
/* 상수                                                                      */
/* -------------------------------------------------------------------------- */
const PUBLIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/fonts',
  '/images',
  '/icons',
  '/preview', // mock UI preview routes (no auth)
];

// 백엔드(TokenProvider)가 RS256 + admin 토큰에 aud="admin"으로 서명함.
const JWT_ALGORITHM = 'RS256';
const JWT_AUDIENCE = 'admin';
// .env: JWT_PUBLIC_KEY 에 PEM 공개키. 멀티라인은 \n escape 도 허용.
const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');

// importSPKI 결과를 모듈 스코프에 캐싱 (middleware는 매 요청 실행되므로 1회만 파싱)
let cachedPublicKey: CryptoKey | null = null;
let publicKeyImportFailed = false;

async function getPublicKey(): Promise<CryptoKey | null> {
  if (cachedPublicKey) return cachedPublicKey;
  if (publicKeyImportFailed) return null;
  if (!JWT_PUBLIC_KEY) {
    console.error('❌ JWT_PUBLIC_KEY 환경변수가 설정되지 않았습니다.');
    publicKeyImportFailed = true;
    return null;
  }
  try {
    cachedPublicKey = await importSPKI(JWT_PUBLIC_KEY, JWT_ALGORITHM);
    return cachedPublicKey;
  } catch (error) {
    console.error('❌ JWT_PUBLIC_KEY 파싱 실패:', error);
    publicKeyImportFailed = true;
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* 유틸 함수                                                                  */
/* -------------------------------------------------------------------------- */
function isStaticPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/* -------------------------------------------------------------------------- */
/* JWT 검증                                                                  */
/* -------------------------------------------------------------------------- */
async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    const publicKey = await getPublicKey();
    if (!publicKey) {
      // 공개키 미설정/파싱 실패 → 검증 불가, invalid 처리
      return { payload: null, isExpired: false, isInvalid: true };
    }

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
    });

    if (
      typeof payload.sub === 'string' &&
      typeof payload.ROLE === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      return {
        payload: payload as CustomJWTPayload,
        isExpired: false,
        isInvalid: false,
      };
    }

    return {
      payload: null,
      isExpired: false,
      isInvalid: true,
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_JWT_EXPIRED'
    ) {
      return {
        payload: null,
        isExpired: true,
        isInvalid: false,
      };
    }

    return {
      payload: null,
      isExpired: false,
      isInvalid: true,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* 토큰 재발급                                                                */
/* -------------------------------------------------------------------------- */
async function reissueTokenWithRetry(
  request: NextRequest,
): Promise<{ ok: boolean; setCookie?: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const cookieHeader = request.headers.get('cookie') || '';

      const response = await fetch(`${API_BASE_URL}/api/admin/reissue/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
      });

      if (response.status === 204) {
        return {
          ok: true,
          setCookie: response.headers.get('set-cookie') || undefined,
        };
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.error(`재발급 요청 오류 ${attempt}/${MAX_RETRIES}:`, error);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return { ok: false };
}

/* -------------------------------------------------------------------------- */
/* 미들웨어                                                                   */
/* -------------------------------------------------------------------------- */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* -------- 정적 자원 무시 -------- */
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('Authorization')?.value;

  /* -------- /signin → /login 리다이렉트 -------- */
  if (pathname === '/signin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------- /login 페이지 특별 처리 (무한루프 방지) -------- */
  if (pathname === '/login') {
    if (token) {
      // 로그인 페이지에서 토큰이 있으면 삭제만 하고 페이지 표시
      console.log('⚠️ 로그인 페이지에서 토큰 발견 - 쿠키 삭제');
      const response = NextResponse.next();
      response.cookies.delete('Authorization');
      response.headers.set(
        'Set-Cookie',
        'Authorization=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      );
      return response;
    }
    // 토큰이 없으면 정상 로그인 페이지 표시
    return NextResponse.next();
  }

  /* -------- 토큰이 없는 경우 /login으로 리다이렉트 -------- */
  if (!token) {
    console.log(`🔒 토큰 없음 → /login으로 리다이렉트 (${pathname})`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------- 토큰 검증 -------- */
  const verification = await verifyToken(token);

  if (verification.payload) {
    // ROLE_ADMIN이 아니면 로그인 페이지로 리다이렉트
    if (verification.payload.ROLE !== 'ROLE_ADMIN') {
      console.log(`❌ 권한 없음: ${verification.payload.ROLE} → /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 유효한 관리자 토큰 - 접근 허용
    console.log(`✅ 유효한 관리자 토큰 - 접근 허용 (${pathname})`);
    return NextResponse.next();
  }

  if (verification.isExpired) {
    console.log(`⏰ 토큰 만료 - 재발급 시도 (${pathname})`);

    const { ok, setCookie } = await reissueTokenWithRetry(request);

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

  // 무효한 토큰인 경우
  console.log(`❌ 무효한 토큰 - /login으로 리다이렉트 (${pathname})`);
  return NextResponse.redirect(new URL('/login', request.url));
}

/* -------------------------------------------------------------------------- */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
