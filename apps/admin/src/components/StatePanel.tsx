import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@udt/ui/components/button';

type StatePanelState = 'loading' | 'error' | 'empty';

interface StatePanelProps {
  state: StatePanelState;
  message?: string;
  onRetry?: () => void;
  /** 높이 등 레이아웃은 호출하는 쪽에서 정해, 상태가 바뀌어도 카드 크기가 유지되게 한다. */
  className?: string;
}

const DEFAULT_MESSAGE: Record<StatePanelState, string> = {
  loading: '불러오는 중이에요...',
  error: '데이터를 불러오지 못했어요.',
  empty: '표시할 데이터가 없어요.',
};

// 카드(공간)는 그대로 두고, 그 안의 내용만 로딩/오류/빈 상태로 바꿔 보여주는 패널.
export default function StatePanel({
  state,
  message,
  onRetry,
  className = '',
}: StatePanelProps) {
  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      className={`flex flex-col items-center justify-center gap-2 text-sm text-gray-500 ${className}`}
    >
      {state === 'loading' && <Loader2 className="size-6 animate-spin" />}
      {state === 'error' && <AlertCircle className="size-6 text-red-400" />}
      {state === 'empty' && <Inbox className="size-6" />}
      <p>{message ?? DEFAULT_MESSAGE[state]}</p>
      {state === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
