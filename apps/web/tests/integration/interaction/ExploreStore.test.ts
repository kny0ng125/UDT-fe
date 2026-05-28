import { useExploreStore } from '@store/ExploreStore';

const resetStore = () => {
  useExploreStore.setState({
    appliedFilters: [],
    tempFilters: [],
    displayedOptionsInTop: [],
    isBottomSheetOpen: false,
    filterOptions: [],
    hasUserData: false,
  });
};

describe('ExploreStore 필터 체인', () => {
  beforeEach(resetStore);

  test('ES1: 빈 상태에서 토글 → appliedFilters와 displayedOptionsInTop 동기화', () => {
    useExploreStore.setState({ filterOptions: ['액션', '드라마', '코미디'] });
    useExploreStore.getState().toggleAppliedFilter('드라마');

    const state = useExploreStore.getState();
    expect(state.appliedFilters).toEqual(['드라마']);
    expect(state.displayedOptionsInTop).toEqual(['드라마']);
  });

  test('ES2: 마지막 필터 제거 → displayedOptionsInTop이 filterOptions로 fallback', () => {
    useExploreStore.setState({
      appliedFilters: ['드라마'],
      filterOptions: ['액션', '드라마', '코미디'],
    });
    useExploreStore.getState().toggleAppliedFilter('드라마');

    const state = useExploreStore.getState();
    expect(state.appliedFilters).toEqual([]);
    expect(state.displayedOptionsInTop).toEqual(['액션', '드라마', '코미디']);
  });

  test('ES3: 여러 필터 조합 → displayedOptionsInTop === appliedFilters', () => {
    useExploreStore.setState({
      appliedFilters: ['드라마'],
      filterOptions: ['액션', '드라마', '코미디'],
    });
    useExploreStore.getState().toggleAppliedFilter('액션');

    const state = useExploreStore.getState();
    expect(state.appliedFilters).toEqual(['드라마', '액션']);
    expect(state.displayedOptionsInTop).toEqual(['드라마', '액션']);
  });

  test('ES4: applyTempFilters → 4개 필드 한 번에', () => {
    useExploreStore.setState({
      tempFilters: ['드라마'],
      appliedFilters: [],
      isBottomSheetOpen: true,
      filterOptions: ['액션', '드라마', '코미디'],
    });
    useExploreStore.getState().applyTempFilters();

    const state = useExploreStore.getState();
    expect(state.appliedFilters).toEqual(['드라마']);
    expect(state.displayedOptionsInTop).toEqual(['드라마']);
    expect(state.isBottomSheetOpen).toBe(false);
    expect(state.tempFilters).toEqual([]);
  });

  test('ES5: 빈 tempFilters로 apply → fallback', () => {
    useExploreStore.setState({
      tempFilters: [],
      appliedFilters: ['드라마'],
      isBottomSheetOpen: true,
      filterOptions: ['액션', '드라마', '코미디'],
    });
    useExploreStore.getState().applyTempFilters();

    const state = useExploreStore.getState();
    expect(state.appliedFilters).toEqual([]);
    expect(state.displayedOptionsInTop).toEqual(['액션', '드라마', '코미디']);
  });
});
