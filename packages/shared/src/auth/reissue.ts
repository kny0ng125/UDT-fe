import type { NextRequest } from 'next/server';
import type { ReissueOptions, ReissueResult } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function reissueToken(
  request: NextRequest,
  options: ReissueOptions,
): Promise<ReissueResult> {
  const { endpoint, maxRetries = 1, backoffMs = 1000 } = options;
  const cookieHeader = request.headers.get('cookie') || '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMs * attempt),
        );
      }
    } catch (error) {
      console.error(`재발급 요청 오류 ${attempt}/${maxRetries}:`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMs * attempt),
        );
      }
    }
  }

  return { ok: false };
}
