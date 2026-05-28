import { renderHook, act } from '@testing-library/react';
import { useSwipe } from '@hooks/recommend/useSwipe';
import { useRecommendStore } from '@store/useRecommendStore';
import type { TicketComponent } from '@type/recommend/TicketComponent';

const makeItems = (n: number): TicketComponent[] =>
  Array.from(
    { length: n },
    (_, i) => ({ contentId: i + 1 }) as unknown as TicketComponent,
  );

beforeEach(() => {
  useRecommendStore.setState({ currentIndex: 0 });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSwipe', () => {
  test('SW1: startDrag → isDragging=true, dragOffset={0,0}', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.startDrag(100, 100));
    expect(result.current.isDragging).toBe(true);
    expect(result.current.dragOffset).toEqual({ x: 0, y: 0 });
  });

  test('SW2: |dx|>|dy| & dx>50 → liked', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(200, 110));
    expect(result.current.feedback).toBe('liked');
  });

  test('SW3: dx<-50 → unliked', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(40, 110));
    expect(result.current.feedback).toBe('unliked');
  });

  test('SW4: dy<-50 → uninterested', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(100, 30));
    expect(result.current.feedback).toBe('uninterested');
  });

  test('SW5: 작은 움직임 → neutral', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(110, 110));
    expect(result.current.feedback).toBe('neutral');
  });

  test('SW6: dx>threshold → right/liked + onSwipe 호출', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(makeItems(3), { onSwipe }));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(300, 100));
    act(() => result.current.endDrag());
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'right', feedback: 'liked' }),
    );
  });

  test('SW7: dx<-threshold → left/unliked', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(makeItems(3), { onSwipe }));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(-100, 100));
    act(() => result.current.endDrag());
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'left', feedback: 'unliked' }),
    );
  });

  test('SW8: dy<-threshold → up/uninterested', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(makeItems(3), { onSwipe }));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(100, -100));
    act(() => result.current.endDrag());
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'up', feedback: 'uninterested' }),
    );
  });

  test('SW9: threshold 미달 → snapback', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(makeItems(3), { onSwipe }));
    act(() => result.current.startDrag(100, 100));
    act(() => result.current.updateDragPosition(150, 100));
    act(() => result.current.endDrag());
    expect(onSwipe).not.toHaveBeenCalled();
    expect(result.current.isSnapback).toBe(true);
  });

  test('SW10: animationDuration 후 currentIndex++, neutral, isAnimating=false', () => {
    const { result } = renderHook(() =>
      useSwipe(makeItems(3), { animationDuration: 500 }),
    );
    act(() => result.current.triggerSwipe('right', 'liked'));
    expect(result.current.isAnimating).toBe(true);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.feedback).toBe('neutral');
    expect(result.current.isAnimating).toBe(false);
  });

  test('SW11: isAnimating 중 startDrag → no-op', () => {
    const { result } = renderHook(() => useSwipe(makeItems(3)));
    act(() => result.current.triggerSwipe('right', 'liked'));
    expect(result.current.isAnimating).toBe(true);
    act(() => result.current.startDrag(100, 100));
    expect(result.current.isDragging).toBe(false);
  });

  test('SW12: triggerSwipe → onSwipe 콜백 호출 (internalHandleSwipe 동일)', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(makeItems(3), { onSwipe }));
    act(() => result.current.triggerSwipe('right', 'liked'));
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'right', feedback: 'liked' }),
    );
  });

  test('SW13: currentIndex가 items.length 도달 → wrap', () => {
    const { result } = renderHook(() =>
      useSwipe(makeItems(2), { animationDuration: 100 }),
    );
    act(() => result.current.triggerSwipe('right', 'liked'));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    act(() => result.current.triggerSwipe('right', 'liked'));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentItem).toEqual(
      expect.objectContaining({ contentId: 1 }),
    );
  });

  test('SW14: cleanup() → 타이머 클리어 (currentIndex 증가 안 함)', () => {
    const { result } = renderHook(() =>
      useSwipe(makeItems(3), { animationDuration: 500 }),
    );
    act(() => result.current.triggerSwipe('right', 'liked'));
    act(() => result.current.cleanup());
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.currentIndex).toBe(0);
  });
});
