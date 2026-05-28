import { useRecommendStore } from '@store/useRecommendStore';

describe('Recommend Pagination', () => {
  describe('shouldLoadMoreContent', () => {
    test.each([9, 19, 29, 39, 49])(
      'currentIndex=%i이면 추가 로드 트리거 (L1)',
      (idx) => {
        useRecommendStore.setState({ currentIndex: idx });
        expect(useRecommendStore.getState().shouldLoadMoreContent()).toBe(true);
      },
    );

    test('currentIndex=0이면 트리거 안함 (L2: >0 조건)', () => {
      useRecommendStore.setState({ currentIndex: 0 });
      expect(useRecommendStore.getState().shouldLoadMoreContent()).toBe(false);
    });

    test('currentIndex=59이면 트리거 안함 (L3: <59 조건)', () => {
      useRecommendStore.setState({ currentIndex: 59 });
      expect(useRecommendStore.getState().shouldLoadMoreContent()).toBe(false);
    });

    test.each([10, 11, 20])(
      'currentIndex=%i처럼 끝자리가 9가 아니면 트리거 안함 (L4)',
      (idx) => {
        useRecommendStore.setState({ currentIndex: idx });
        expect(useRecommendStore.getState().shouldLoadMoreContent()).toBe(
          false,
        );
      },
    );

    test.each([60, 69, 100])(
      'currentIndex=%i (60 이상)이면 트리거 안함 (L5)',
      (idx) => {
        useRecommendStore.setState({ currentIndex: idx });
        expect(useRecommendStore.getState().shouldLoadMoreContent()).toBe(
          false,
        );
      },
    );
  });

  describe('shouldShowFinish', () => {
    test('totalSwipeCount=60이면 finish 노출 (F1: 경계)', () => {
      useRecommendStore.setState({ totalSwipeCount: 60 });
      expect(useRecommendStore.getState().shouldShowFinish()).toBe(true);
    });

    test('totalSwipeCount=59이면 노출 안함 (F2: 경계 아래)', () => {
      useRecommendStore.setState({ totalSwipeCount: 59 });
      expect(useRecommendStore.getState().shouldShowFinish()).toBe(false);
    });

    test('totalSwipeCount=100이면 노출 (F3)', () => {
      useRecommendStore.setState({ totalSwipeCount: 100 });
      expect(useRecommendStore.getState().shouldShowFinish()).toBe(true);
    });

    test('totalSwipeCount=0이면 노출 안함 (F4)', () => {
      useRecommendStore.setState({ totalSwipeCount: 0 });
      expect(useRecommendStore.getState().shouldShowFinish()).toBe(false);
    });
  });
});
