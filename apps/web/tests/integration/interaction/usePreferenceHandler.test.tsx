jest.mock('@hooks/profile/usePatchPlatform');
jest.mock('@hooks/profile/usePatchGenre');
jest.mock('@hooks/recommend/useDeleteRecommendationCache');

import { renderHook, act } from '@testing-library/react';
import { usePatchPlatform } from '@hooks/profile/usePatchPlatform';
import { usePatchGenre } from '@hooks/profile/usePatchGenre';
import { useDeleteRecommendationCache } from '@hooks/recommend/useDeleteRecommendationCache';
import { usePreferenceHandler } from '@hooks/profile/usePreferenceHandler';
import * as Toast from '@udt/ui/common/Toast';

const patchPlatformAsync = jest.fn();
const patchGenreAsync = jest.fn();
const clearCacheAsync = jest.fn();

let successSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let confirmSpy: jest.SpyInstance;

beforeEach(() => {
  patchPlatformAsync.mockReset().mockResolvedValue(undefined);
  patchGenreAsync.mockReset().mockResolvedValue(undefined);
  clearCacheAsync.mockReset().mockResolvedValue(undefined);

  (usePatchPlatform as jest.Mock).mockReturnValue({
    mutateAsync: patchPlatformAsync,
  });
  (usePatchGenre as jest.Mock).mockReturnValue({
    mutateAsync: patchGenreAsync,
  });
  (useDeleteRecommendationCache as jest.Mock).mockReturnValue({
    mutateAsync: clearCacheAsync,
  });

  successSpy = jest
    .spyOn(Toast.showSimpleToast, 'success')
    .mockImplementation(() => {});
  errorSpy = jest
    .spyOn(Toast.showSimpleToast, 'error')
    .mockImplementation(() => {});
  confirmSpy = jest
    .spyOn(Toast.showInteractiveToast, 'confirm')
    .mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePreferenceHandler', () => {
  describe('C1: 인터랙션', () => {
    test('PH1: selectedOtt 빈 + platform → 에러 토스트, patchPlatform 미호출', () => {
      const { result } = renderHook(() => usePreferenceHandler([], ['액션']));
      act(() => result.current.handleSave('platform'));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '변경할 OTT를 선택해주세요.' }),
      );
      expect(patchPlatformAsync).not.toHaveBeenCalled();
    });

    test('PH2: selectedGenres 빈 + genre → 에러 토스트, patchGenre 미호출', () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('genre'));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '변경할 장르를 선택해주세요.' }),
      );
      expect(patchGenreAsync).not.toHaveBeenCalled();
    });

    test('PH3: 유효 입력 + handleSave → confirm 1회', () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('platform'));
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    test('PH4: 연속 handleSave → 두 번째 무시', () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('platform'));
      act(() => result.current.handleSave('platform'));
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    test('PH5: onCancel → isToastOpen 복구 (다음 handleSave 동작)', () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('platform'));
      const opts = confirmSpy.mock.calls[0][0];
      act(() => opts.onCancel?.());
      act(() => result.current.handleSave('platform'));
      expect(confirmSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('C2: 서버 응답', () => {
    test('PH-S1: confirm onConfirm → patchPlatformsAsync(selectedOtt)', async () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix', 'tving'], []),
      );
      act(() => result.current.handleSave('platform'));
      await act(async () => {
        await confirmSpy.mock.calls[0][0].onConfirm();
      });
      expect(patchPlatformAsync).toHaveBeenCalledWith(['netflix', 'tving']);
    });

    test('PH-S2: patchPlatformsAsync 성공 → clearCacheAsync 호출', async () => {
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('platform'));
      await act(async () => {
        await confirmSpy.mock.calls[0][0].onConfirm();
      });
      expect(clearCacheAsync).toHaveBeenCalled();
    });

    test('PH-S3: patchPlatformsAsync 실패 → 에러 토스트 + 복구', async () => {
      patchPlatformAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() =>
        usePreferenceHandler(['netflix'], []),
      );
      act(() => result.current.handleSave('platform'));
      await act(async () => {
        await confirmSpy.mock.calls[0][0].onConfirm();
      });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '설정 저장에 실패했습니다.' }),
      );
      act(() => result.current.handleSave('platform'));
      expect(confirmSpy).toHaveBeenCalledTimes(2);
    });

    test('PH-S4: handleSave(genre) → patchGenresAsync(selectedGenres)', async () => {
      const { result } = renderHook(() =>
        usePreferenceHandler([], ['액션', '드라마']),
      );
      act(() => result.current.handleSave('genre'));
      await act(async () => {
        await confirmSpy.mock.calls[0][0].onConfirm();
      });
      expect(patchGenreAsync).toHaveBeenCalledWith(['액션', '드라마']);
    });
  });
});
