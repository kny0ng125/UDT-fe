import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { usePostCuratedContent } from '@hooks/recommend/usePostCuratedContents';
import { createQueryWrapper } from '../_helpers/queryClient';
import * as Toast from '@udt/ui/common/Toast';

const POST_PATH = '/api/v1/contents/recommendations/contents';

let successSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  successSpy = jest
    .spyOn(Toast.showSimpleToast, 'success')
    .mockImplementation(() => {});
  errorSpy = jest
    .spyOn(Toast.showSimpleToast, 'error')
    .mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePostCuratedContent', () => {
  describe('C1: optimistic 흐름', () => {
    test('O1: mutate(contentId) → onOptimisticUpdate(contentId) 즉시', async () => {
      server.use(
        http.post(POST_PATH, () => HttpResponse.json({}, { status: 200 })),
      );
      const onOptimisticUpdate = jest.fn();
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => usePostCuratedContent({ onOptimisticUpdate, retry: 0 }),
        { wrapper: Wrapper },
      );
      result.current.mutate(42);
      await waitFor(() => expect(onOptimisticUpdate).toHaveBeenCalledWith(42));
    });

    test('O2: 성공 → onSuccessCallback + 성공 토스트', async () => {
      server.use(
        http.post(POST_PATH, () => HttpResponse.json({}, { status: 200 })),
      );
      const onSuccessCallback = jest.fn();
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => usePostCuratedContent({ onSuccessCallback, retry: 0 }),
        { wrapper: Wrapper },
      );
      result.current.mutate(42);
      await waitFor(() => expect(onSuccessCallback).toHaveBeenCalled());
      expect(successSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '컨텐츠가 성공적으로 저장되었습니다.',
        }),
      );
    });

    test('O3: 실패 → onOptimisticRevert + onErrorCallback', async () => {
      server.use(
        http.post(POST_PATH, () =>
          HttpResponse.json({ message: 'fail' }, { status: 500 }),
        ),
      );
      const onOptimisticRevert = jest.fn();
      const onErrorCallback = jest.fn();
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () =>
          usePostCuratedContent({
            onOptimisticRevert,
            onErrorCallback,
            retry: 0,
          }),
        { wrapper: Wrapper },
      );
      result.current.mutate(42);
      await waitFor(() => expect(onOptimisticRevert).toHaveBeenCalledWith(42));
      expect(onErrorCallback).toHaveBeenCalled();
    });

    test('O4: showToast=false → 토스트 0회', async () => {
      server.use(
        http.post(POST_PATH, () => HttpResponse.json({}, { status: 200 })),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => usePostCuratedContent({ showToast: false, retry: 0 }),
        { wrapper: Wrapper },
      );
      result.current.mutate(42);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(successSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('C2: 서버 응답 분기', () => {
    test('E1: 409 → "이미 저장된 콘텐츠입니다."', async () => {
      server.use(
        http.post(POST_PATH, () =>
          HttpResponse.json({ message: 'conflict' }, { status: 409 }),
        ),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(() => usePostCuratedContent({ retry: 0 }), {
        wrapper: Wrapper,
      });
      result.current.mutate(42);
      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 저장된 콘텐츠입니다.' }),
      );
    });

    test('E2: 500 → "저장에 실패하였습니다."', async () => {
      server.use(
        http.post(POST_PATH, () =>
          HttpResponse.json({ message: 'server error' }, { status: 500 }),
        ),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(() => usePostCuratedContent({ retry: 0 }), {
        wrapper: Wrapper,
      });
      result.current.mutate(42);
      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '저장에 실패하였습니다.' }),
      );
    });

    test('E3: error.message에 "already exists" → 이미 저장됨', async () => {
      server.use(
        http.post(POST_PATH, () =>
          HttpResponse.json({ message: 'already exists' }, { status: 500 }),
        ),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(() => usePostCuratedContent({ retry: 0 }), {
        wrapper: Wrapper,
      });
      result.current.mutate(42);
      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 저장된 콘텐츠입니다.' }),
      );
    });

    test('E4: error.message에 "이미 저장된" → 이미 저장됨', async () => {
      server.use(
        http.post(POST_PATH, () =>
          HttpResponse.json({ message: '이미 저장된 콘텐츠' }, { status: 500 }),
        ),
      );
      const { Wrapper } = createQueryWrapper();
      const { result } = renderHook(() => usePostCuratedContent({ retry: 0 }), {
        wrapper: Wrapper,
      });
      result.current.mutate(42);
      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 저장된 콘텐츠입니다.' }),
      );
    });
  });
});
