'use client';

// 로딩 인디케이터 비교용 preview (mock UI, 인증 없음)
// 배경(스와이프/완료/결과) × 인디케이터(스피너/점바운스/막대/점펄스)를 토글로 비교한다.
// 모든 로딩은 50% dim 오버레이로 통일하기로 함 → 전체화면 모드는 제거.

import { useState } from 'react';
import { CheckCircle, RotateCcw, Eye, Plus, Undo2 } from 'lucide-react';
import { Button } from '@udt/ui/components/button';

const MESSAGE = '추천 결과를 준비하고 있어요!';
const SUBMESSAGE = '곧 완성된 결과를 보여드릴게요...';

type Background = 'swipe' | 'finish' | 'result';
type Indicator = 'spinner' | 'dots' | 'bars' | 'pulse';

// ── 인디케이터 후보 4종 ─────────────────────────────────────
function IndicatorView({ type }: { type: Indicator }) {
  if (type === 'spinner') {
    return (
      <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-yellow-200 animate-spin shadow-[0_0_15px_rgba(254,240,138,0.45)]" />
    );
  }
  if (type === 'dots') {
    return (
      <div className="flex gap-2">
        {[0, 0.15, 0.3].map((d) => (
          <div
            key={d}
            className="h-3 w-3 rounded-full bg-yellow-200 animate-bounce"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    );
  }
  if (type === 'bars') {
    return (
      <div className="flex items-end gap-1.5 h-10">
        {[0, 0.1, 0.2, 0.3, 0.4].map((d) => (
          <div
            key={d}
            className="w-2 h-full rounded-sm bg-yellow-200 origin-bottom animate-loading-bar shadow-[0_0_10px_rgba(254,240,138,0.4)]"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    );
  }
  // pulse: 투명도 대비 크게, 크기 고정, delay 차등으로 웨이브 (animate-loading-dot)
  return (
    <div className="flex gap-2">
      {[0, 0.2, 0.4].map((d) => (
        <div
          key={d}
          className="h-3 w-3 rounded-full bg-yellow-200 animate-loading-dot"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}

// ── 배경 mock 3종 ───────────────────────────────────────────
function MockSwipeScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-primary-900 via-purple-900 to-indigo-900 text-white p-6">
      <div className="text-xl">컨텐츠에 대한 피드백을 남겨주세요! 🤔</div>
      <div className="w-[80%] max-w-100 aspect-[2/3] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
        <span className="text-white/40">콘텐츠 카드</span>
      </div>
      <div className="w-[80%] max-w-100 h-2 rounded-full bg-white/10">
        <div className="h-full w-1/3 rounded-full bg-yellow-200" />
      </div>
    </div>
  );
}

function MockFinishScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary-900 via-purple-900 to-indigo-900 text-white p-6 text-center">
      <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
        <CheckCircle className="w-10 h-10 text-purple-900" />
      </div>
      <h1 className="text-2xl font-bold">추천이 완료되었습니다!</h1>
      <p className="text-purple-200 max-w-sm">
        당신만을 위한 맞춤 콘텐츠를 준비했어요.
      </p>
      <div className="space-y-4 w-full max-w-xs">
        <Button className="w-full bg-purple-600 text-white py-4 rounded-full">
          <Eye className="w-5 h-5 mr-2" />
          추천 결과 보러가기
        </Button>
        <Button
          variant="outline"
          className="w-full border-2 border-purple-400 text-purple-200 py-4 rounded-full bg-transparent"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          다시 시작하기
        </Button>
      </div>
    </div>
  );
}

function MockResultScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-primary-900 via-purple-900 to-indigo-900 text-white">
      <div className="text-center py-5">
        <h1 className="text-2xl font-bold mb-1">추천 결과</h1>
        <p className="text-purple-200">마음에 드는 콘텐츠를 선택해보세요</p>
      </div>
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-[70%] max-w-90 aspect-[2/3] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white/40">추천 카드</span>
        </div>
      </div>
      <div className="flex justify-center gap-4 my-5">
        <Button className="px-8 py-3 bg-primary-500 text-white rounded-full">
          <Plus className="w-5 h-5 mr-1" />이 콘텐츠 추가하기
        </Button>
        <Button className="px-8 py-3 bg-primary-500 text-white rounded-full">
          <Undo2 className="w-5 h-5 mr-1" />
          다시 추천받기
        </Button>
      </div>
    </div>
  );
}

const BACKGROUNDS: Record<
  Background,
  { label: string; node: React.ReactNode }
> = {
  swipe: { label: '스와이프', node: <MockSwipeScreen /> },
  finish: { label: '완료', node: <MockFinishScreen /> },
  result: { label: '결과', node: <MockResultScreen /> },
};

const INDICATORS: { key: Indicator; label: string }[] = [
  { key: 'spinner', label: '스피너' },
  { key: 'dots', label: '점 바운스' },
  { key: 'bars', label: '막대' },
  { key: 'pulse', label: '점 펄스' },
];

// ── preview 페이지 ──────────────────────────────────────────
export default function PreviewLoadingPage() {
  const [bg, setBg] = useState<Background>('swipe');
  const [indicator, setIndicator] = useState<Indicator>('bars');
  const [visible, setVisible] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 컨트롤 바 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
        {/* 배경 선택 */}
        <div className="flex gap-2 rounded-full bg-black/60 p-1 backdrop-blur">
          {(Object.keys(BACKGROUNDS) as Background[]).map((key) => (
            <button
              key={key}
              onClick={() => setBg(key)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                bg === key ? 'bg-white text-black' : 'text-white'
              }`}
            >
              {BACKGROUNDS[key].label}
            </button>
          ))}
        </div>
        {/* 인디케이터 선택 */}
        <div className="flex gap-2 rounded-full bg-black/60 p-1 backdrop-blur">
          {INDICATORS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setIndicator(key)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                indicator === key ? 'bg-white text-black' : 'text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* 토글 */}
        <button
          onClick={() => setVisible((v) => !v)}
          className="px-3 py-1 rounded-full text-sm text-white border border-white/40 bg-black/60 backdrop-blur"
        >
          {visible ? '로딩 끄기' : '로딩 켜기'}
        </button>
      </div>

      {/* 선택된 배경 (mock) */}
      {BACKGROUNDS[bg].node}

      {/* 오버레이 50% dim + 선택된 인디케이터 */}
      {visible && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/50 backdrop-blur-sm">
          <div className="text-center text-white">
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '1s' }}
            >
              <h2 className="text-xl font-medium mb-2 animate-typing">
                {MESSAGE}
              </h2>
              <p
                className="text-sm opacity-80 animate-fade-in"
                style={{ animationDelay: '1.5s' }}
              >
                {SUBMESSAGE}
              </p>
            </div>
          </div>
          {/* 타이핑(약 2s) 완료 후 인디케이터 등장 */}
          <div className="animate-fade-in" style={{ animationDelay: '2.2s' }}>
            <IndicatorView type={indicator} />
          </div>
        </div>
      )}
    </div>
  );
}
