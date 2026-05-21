import { jwtVerify, importSPKI, type CryptoKey } from 'jose';
import type {
  CustomJWTPayload,
  TokenVerificationResult,
  VerifyTokenOptions,
} from './types';

const JWT_ALGORITHM = 'RS256';

const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');

let cachedPublicKey: CryptoKey | null = null;
let publicKeyImportFailed = false;

export async function getPublicKey(): Promise<CryptoKey | null> {
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

export async function verifyToken(
  token: string,
  options: VerifyTokenOptions,
): Promise<TokenVerificationResult> {
  try {
    const publicKey = await getPublicKey();
    if (!publicKey) {
      return { payload: null, isExpired: false, isInvalid: true };
    }

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: [JWT_ALGORITHM],
      audience: options.audience,
    });

    const isShape =
      typeof payload.sub === 'string' &&
      typeof payload.ROLE === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number';

    if (!isShape) {
      return { payload: null, isExpired: false, isInvalid: true };
    }

    if (
      options.allowedRoles &&
      !options.allowedRoles.includes(payload.ROLE as string)
    ) {
      console.warn(`Invalid role detected: ${payload.ROLE}`);
      return { payload: null, isExpired: false, isInvalid: true };
    }

    return {
      payload: payload as CustomJWTPayload,
      isExpired: false,
      isInvalid: false,
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_JWT_EXPIRED'
    ) {
      return { payload: null, isExpired: true, isInvalid: false };
    }

    console.error('JWT VERIFICATION FAILED:', error);
    return { payload: null, isExpired: false, isInvalid: true };
  }
}
