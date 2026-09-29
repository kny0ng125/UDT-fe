'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export type PreviewSeed = { queryKey: readonly unknown[]; data: unknown };

/**
 * preview 전용 — react-query 캐시에 mock 데이터를 미리 심고 그 subtree에 제공한다.
 * layout 의 실제 QueryClientProvider 안쪽에 중첩되면, 이 client 가 우선 적용되어
 * 클라이언트 컴포넌트의 useQuery 들이 백엔드 없이 mock 을 읽는다.
 */
export function PreviewQueryProvider({
  seeds,
  children,
}: {
  seeds: PreviewSeed[];
  children: ReactNode;
}) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          refetchOnWindowFocus: false,
        },
      },
    });
    for (const { queryKey, data } of seeds) {
      qc.setQueryData(queryKey, data);
    }
    return qc;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
