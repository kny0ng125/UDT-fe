import { create } from 'zustand';

// 라우트 이동이 진행 중인지 (클릭한 순간 ~ 주소가 바뀔 때까지).
// true 인 동안 LayoutWrapper 가 LoadingScreen 을 덮는다.
interface NavigationState {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isNavigating: false,
  setIsNavigating: (isNavigating) => set({ isNavigating }),
}));
