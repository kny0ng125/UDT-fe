import type { JWTPayload as JoseJWTPayload } from 'jose';

export interface CustomJWTPayload extends JoseJWTPayload {
  sub: string;
  ROLE: string;
  iat: number;
  exp: number;
}

export interface TokenVerificationResult {
  payload: CustomJWTPayload | null;
  isExpired: boolean;
  isInvalid: boolean;
}

export interface ReissueResult {
  ok: boolean;
  setCookie?: string;
}

export interface VerifyTokenOptions {
  audience: string;
  allowedRoles?: readonly string[];
}

export interface ReissueOptions {
  endpoint: string;
  maxRetries?: number;
  backoffMs?: number;
}
