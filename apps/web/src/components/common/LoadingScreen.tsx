// components/LoadingScreen.tsx
'use client';

import React from 'react';

interface LoadingScreenProps {
  message: string;
  submessage: string;
}

// 모든 로딩을 기존 화면 위 50% dim 오버레이로 통일.
// 메시지 타이핑(약 2s) 완료 후 점 펄스 인디케이터가 fade-in으로 등장.
// ⚠️ absolute 기준이므로 부모에 relative가 있어야 함 (LayoutWrapper 앱 컨테이너가 relative).
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  submessage,
}) => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/50 backdrop-blur-sm">
    <div className="text-center text-white">
      <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
        <h2 className="text-xl font-medium mb-2 animate-typing">{message}</h2>
        <p
          className="text-sm opacity-80 animate-fade-in"
          style={{ animationDelay: '1.5s' }}
        >
          {submessage}
        </p>
      </div>
    </div>

    {/* 타이핑(약 2s) 완료 후 인디케이터 등장 */}
    <div className="animate-fade-in" style={{ animationDelay: '2.2s' }}>
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
  </div>
);
