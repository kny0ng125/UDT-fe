// components/LoadingScreen.tsx
'use client';

import React from 'react';

interface LoadingScreenProps {
  message: string;
  submessage: string;
}

// 모든 로딩을 기존 화면 위 50% dim 오버레이로 통일.
// 클릭 직후 바로 반응하는 것처럼 보이도록 문구는 처음부터 보이고, 점 인디케이터만 움직인다.
// ⚠️ absolute 기준이므로 부모에 relative가 있어야 함 (LayoutWrapper 앱 컨테이너가 relative).
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  submessage,
}) => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/50 backdrop-blur-sm">
    <div className="text-center text-white">
      <h2 className="text-xl font-medium mb-2">{message}</h2>
      <p className="text-sm opacity-80">{submessage}</p>
    </div>

    <div className="flex gap-2">
      {[0, 0.2, 0.4].map((d) => (
        <div
          key={d}
          className="h-3 w-3 rounded-full bg-yellow-200 animate-loading-dot"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  </div>
);
