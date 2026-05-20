'use client';

import { useState, useEffect } from 'react';
import { type PanInfo } from 'framer-motion';
import { Button } from '@udt/ui/components/button';
import { MockMovies } from './moviedata';
import ResultCard, { type ResultCardState } from './ResultCard';
import type { OnboardingStepProps } from './types';
import {
  SWIPE_THRESHOLD_PX,
  RESULT_CARD_GAP_PX,
  RESULT_CARD_COUNT,
  REROLL_POOL_MIN,
} from './constants';

export default function Step7({ onNext }: OnboardingStepProps) {
  const [cards, setCards] = useState<ResultCardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    setCards(
      MockMovies.slice(0, RESULT_CARD_COUNT).map((movie) => ({
        movie,
        isFlipped: false,
        rerollUsed: false,
      })),
    );
  }, []);

  const updateCard = (idx: number, patch: Partial<ResultCardState>) => {
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  };

  const handleFlip = (idx: number) => {
    updateCard(idx, { isFlipped: !cards[idx].isFlipped });
  };

  const handleReroll = (idx: number) => {
    if (cards[idx].rerollUsed || MockMovies.length < REROLL_POOL_MIN) return;
    updateCard(idx, {
      movie: MockMovies[idx + RESULT_CARD_COUNT],
      rerollUsed: true,
      isFlipped: false,
    });
  };

  const handleDragEnd = (info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD_PX && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else if (
      info.offset.x < -SWIPE_THRESHOLD_PX &&
      currentIndex < cards.length - 1
    ) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const getCardPosition = (idx: number) => {
    const diff = idx - currentIndex;
    return {
      x: diff * RESULT_CARD_GAP_PX,
      scale: diff === 0 ? 1 : 0.8,
      opacity: diff === 0 ? 1 : 0.6,
      zIndex: diff === 0 ? 10 : 1,
    };
  };

  return (
    <div className="relative flex flex-col w-full h-full items-center justify-center text-white px-4 py-4">
      <div className="w-full text-center pt-8 pb-4 z-20">
        <p className="text-sm md:text-base font-semibold leading-relaxed text-white">
          👀 <strong>눈 버튼</strong>을 눌러 상세 정보를 확인하고 <br />
          🔄 <strong>리롤 버튼(1회)</strong>으로 다른 콘텐츠도 확인이 가능해요!
        </p>
      </div>

      <div className="relative flex-1 w-[80%] min-w-70 max-w-100 min-h-110 max-h-170 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {cards.map((card, idx) => (
            <ResultCard
              key={`${card.movie.contentId}-${card.rerollUsed}-${card.isFlipped}`}
              card={card}
              position={getCardPosition(idx)}
              isCenter={idx === currentIndex}
              onFlip={() => handleFlip(idx)}
              onReroll={() => handleReroll(idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      <div className="w-full text-center pt-4 pb-8">
        <Button
          variant="default"
          className="px-8 py-3 text-sm md:text-base font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition"
          onClick={onNext}
        >
          계속
        </Button>
      </div>
    </div>
  );
}
