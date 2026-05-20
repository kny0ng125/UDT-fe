'use client';

import { useState, type ReactNode } from 'react';
import Lottie from 'lottie-react';
import { Button } from '@udt/ui/components/button';
import { SwipeContainer } from '@components/Recommend/SwipeContainer';
import { MockMovies } from './moviedata';

export interface TutorialStepConfig {
  heading: ReactNode;
  subheading?: ReactNode;
  helperText?: ReactNode;
  lottie?: unknown;
  // Step4처럼 카드 뒷면 보기를 허용할지. 기본 false.
  allowFlip?: boolean;
}

interface TutorialStepProps extends TutorialStepConfig {
  onNext: () => void;
}

// Step0~Step4 공통 튜토리얼 step.
// subheading 유무로 heading 강조 사이즈 자동 결정 (subheading 있으면 큰 글씨, 없으면 컴팩트).
export default function TutorialStep({
  heading,
  subheading,
  helperText,
  lottie,
  allowFlip = false,
  onNext,
}: TutorialStepProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const movieItems = [MockMovies[0]];

  const headingSize = subheading ? 'text-xl md:text-2xl' : 'text-lg md:text-xl';

  return (
    <div className="relative flex items-center justify-center h-full w-full px-6 text-white">
      <div className="flex w-[80%] h-[75%] max-h-170 max-w-100 min-w-70 min-h-110 justify-center items-center">
        <div className="w-full h-full">
          <SwipeContainer
            items={movieItems}
            enableKeyboard={false}
            isFlipped={allowFlip ? isFlipped : false}
            onFlipToggle={allowFlip ? setIsFlipped : () => {}}
          />
        </div>
      </div>

      <div className="absolute inset-0 bg-black/50 z-20 flex flex-col items-center justify-center text-center px-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <h2 className={`${headingSize} font-semibold leading-relaxed`}>
            {heading}
          </h2>
          {subheading && (
            <p className="text-sm md:text-xl text-white/80 animate-pulse">
              {subheading}
            </p>
          )}
          {helperText && (
            <p className="mt-1 text-xs md:text-sm text-white/50">
              {helperText}
            </p>
          )}
        </div>

        {lottie != null && (
          <Lottie
            animationData={lottie}
            loop
            autoplay
            className="w-[300px] h-[200px]"
          />
        )}

        <Button
          variant="default"
          className="mt-4 px-8 py-4 text-sm md:text-lg font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition"
          onClick={onNext}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
