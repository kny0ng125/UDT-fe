import type { ReactNode } from 'react';

/**
 * preview 배너를 fixed 오버레이로 띄우고 children 을 그대로 통과시킨다.
 * 중요: 중간에 div 를 끼우지 않아 LayoutWrapper 가 제공하는 height 체인
 * (h-full / calc(100%-60px))이 그대로 자식에게 전달된다. (recommend 처럼
 * h-full 풀스크린 레이아웃이 깨지지 않게 하려면 래핑 div 를 넣으면 안 된다.)
 */
export function PreviewFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[100] bg-yellow-400/90 text-black text-xs text-center py-1 pointer-events-none">
        🧪 Preview — {label}
      </div>
      {children}
    </>
  );
}
