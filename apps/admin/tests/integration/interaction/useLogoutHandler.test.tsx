const pushSpy = jest.fn();

jest.mock('@udt/shared/apis/authService', () => ({
  authService: { logout: jest.fn() },
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy }),
}));

import { renderHook, act } from '@testing-library/react';
import { useLogoutHandler } from '@hooks/useLogoutHandler';
import { authService } from '@udt/shared/apis/authService';
import * as Toast from '@udt/ui/common/Toast';

let successSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let confirmSpy: jest.SpyInstance;
let localClearSpy: jest.SpyInstance;

beforeEach(() => {
  pushSpy.mockReset();
  (authService.logout as jest.Mock).mockReset().mockResolvedValue(undefined);

  successSpy = jest
    .spyOn(Toast.showSimpleToast, 'success')
    .mockImplementation(() => {});
  errorSpy = jest
    .spyOn(Toast.showSimpleToast, 'error')
    .mockImplementation(() => {});
  confirmSpy = jest
    .spyOn(Toast.showInteractiveToast, 'confirm')
    .mockImplementation(() => {});
  localClearSpy = jest.spyOn(Storage.prototype, 'clear');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useLogoutHandler', () => {
  test('LG1: handleLogout → confirm 1회', () => {
    const { result } = renderHook(() => useLogoutHandler());
    act(() => result.current.handleLogout());
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  test('LG2: 성공 → logout + storage.clear(2회) + push("/login") + 성공 토스트', async () => {
    const { result } = renderHook(() => useLogoutHandler());
    act(() => result.current.handleLogout());
    await act(async () => {
      await confirmSpy.mock.calls[0][0].onConfirm();
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(localClearSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenCalledWith('/login');
    expect(successSpy).toHaveBeenCalled();
  });

  test('LG3: 호출 순서 logout → clear → clear → push', async () => {
    const order: string[] = [];
    (authService.logout as jest.Mock).mockImplementation(async () => {
      order.push('logout');
    });
    localClearSpy.mockImplementation(() => {
      order.push('clear');
    });
    pushSpy.mockImplementation(() => {
      order.push('push');
    });

    const { result } = renderHook(() => useLogoutHandler());
    act(() => result.current.handleLogout());
    await act(async () => {
      await confirmSpy.mock.calls[0][0].onConfirm();
    });

    expect(order).toEqual(['logout', 'clear', 'clear', 'push']);
  });

  test('LG4: logout reject → 에러 토스트 + push/clear 미호출', async () => {
    (authService.logout as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useLogoutHandler());
    act(() => result.current.handleLogout());
    await act(async () => {
      await confirmSpy.mock.calls[0][0].onConfirm();
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: '로그아웃에 실패했습니다.' }),
    );
    expect(pushSpy).not.toHaveBeenCalled();
    expect(localClearSpy).not.toHaveBeenCalled();
  });
});
