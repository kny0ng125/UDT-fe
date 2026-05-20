'use client';

interface PreviewBannerProps {
  label: string;
}

// 각 preview 페이지 상단의 미니 안내 배너.
// LayoutWrapper 안에 들어가므로 absolute 대신 페이지 흐름의 일부로 둠.
export default function PreviewBanner({ label }: PreviewBannerProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[100] bg-yellow-400/90 text-black text-[11px] text-center py-1 pointer-events-none">
      🧪 Preview — {label}
    </div>
  );
}
