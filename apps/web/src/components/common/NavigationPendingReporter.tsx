'use client';

import { useLayoutEffect } from 'react';
import { useLinkStatus } from 'next/link';
import { useNavigationStore } from '@store/useNavigationStore';

// <Link> 의 자식으로 넣어 두면, 클릭한 순간부터 주소가 바뀔 때까지(pending) 전역 이동 상태를 true 로 만든다.
// useLayoutEffect: 클릭과 같은 프레임에 오버레이가 보이도록 paint 전에 반영한다.
// (이미 prefetch 된 경로는 pending 이 건너뛰어져서 오버레이가 깜빡이지 않는다)
export function NavigationPendingReporter() {
  const { pending } = useLinkStatus();
  const setIsNavigating = useNavigationStore((state) => state.setIsNavigating);

  useLayoutEffect(() => {
    if (!pending) return;
    setIsNavigating(true);
    return () => setIsNavigating(false);
  }, [pending, setIsNavigating]);

  return null;
}
