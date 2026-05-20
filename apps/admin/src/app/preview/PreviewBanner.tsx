'use client';

interface PreviewBannerProps {
  title: string;
  description: string;
}

// 각 admin preview 페이지 상단의 안내 헤더.
// 인증 없이 mock 화면을 보고 있다는 점 + 화면 이름/설명을 노출.
export default function PreviewBanner({
  title,
  description,
}: PreviewBannerProps) {
  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="rounded-none border-yellow-200 bg-yellow-50 px-4 py-1 text-xs text-yellow-900 text-center">
        🧪 Preview 모드 — 인증 없이 보는 mock 화면 (실제 데이터/액션 동작 안 함)
      </div>
      <div className="flex h-14 items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground leading-tight">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
