'use client';

import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { Ticket } from '@components/Recommend/Ticket';
import { Button } from '@udt/ui/components/button';
import type { TicketComponent } from '@type/recommend/TicketComponent';

export interface ResultCardState {
  movie: TicketComponent;
  isFlipped: boolean;
  rerollUsed: boolean;
}

interface ResultCardProps {
  card: ResultCardState;
  position: { x: number; scale: number; opacity: number; zIndex: number };
  isCenter: boolean;
  onFlip: () => void;
  onReroll: () => void;
  onDragEnd: (info: PanInfo) => void;
}

// 온보딩 Step7 결과 카드 한 장. 가운데 카드만 뒤집기/리롤 액션 노출.
export default function ResultCard({
  card,
  position,
  isCenter,
  onFlip,
  onReroll,
  onDragEnd,
}: ResultCardProps) {
  const { movie, isFlipped, rerollUsed } = card;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0}
      onDragEnd={(_, info) => onDragEnd(info)}
      animate={position}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute w-full h-full"
    >
      {isCenter ? (
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`flip-${movie.contentId}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? 90 : -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: isFlipped ? -90 : 90 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Ticket
                movie={movie}
                variant={isFlipped ? 'detail' : 'result'}
                feedback="neutral"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <Ticket movie={movie} variant="result" feedback="neutral" />
        </div>
      )}

      {isCenter && (
        <div className="absolute -top-2 -right-2 flex gap-2 z-50">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={onFlip}
              className="w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg"
            >
              {isFlipped ? (
                <EyeOff className="w-3 h-3 text-black" />
              ) : (
                <Eye className="w-3 h-3 text-black" />
              )}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={onReroll}
              disabled={rerollUsed}
              className="w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg disabled:bg-gray-100"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  rerollUsed ? 'text-gray-400' : 'text-black'
                }`}
              />
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
