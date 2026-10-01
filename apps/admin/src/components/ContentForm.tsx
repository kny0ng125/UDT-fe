'use client';

import type React from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@udt/ui/components/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@udt/ui/components/tabs';
import type {
  ContentWithoutId,
  ContentCreateUpdate,
  PlatformInfo,
} from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';
import { showSimpleToast } from '@udt/ui/common/Toast';
import { AlertCircle, ArrowDown } from 'lucide-react';
import { useErrorToastOnce } from '@udt/shared/hooks/useErrorToastOnce';
import { usePostUploadImages } from '@hooks/admin/usePostUploadImages';
import ActorSearchDialog from '@components/dialogs/actorSearchDialog';
import DirectorSearchDialog from '@components/dialogs/directorSearchDialog';

// 분리된 컴포넌트들 import
import BasicInfo from '@components/ContentFormSections/BasicInfo';
import DetailedInfo from '@components/ContentFormSections/DetailedInfo';
import DirectorInfo from '@components/ContentFormSections/DirectorInfo';
import CastInfo from '@components/ContentFormSections/CastInfo';
import PlatformSection from '@components/ContentFormSections/PlatformInfo';
import BulkPersonRegistration from '@components/bulkPersonRegistration';
import { validateFormData } from '@utils/admin/validateFormData';
import {
  describeValidationError,
  getErrorAnchorId,
} from '@utils/admin/describeValidationError';

interface ContentFormProps {
  content?: ContentWithoutId;
  onSave: (content: ContentCreateUpdate) => void;
  onCancel: () => void;
  validationErrors?: JobValidationError[];
  /** 제출 버튼 문구. 기본은 content 유무에 따라 수정/추가 */
  submitLabel?: string;
}

export type FieldErrorLookup = (
  fieldPath: string,
) => JobValidationError | undefined;

// 폼 데이터 초기값
// 'categories[0].genres[1]' -> 'categories.genres'
const normalizeFieldPath = (field: string) => field.replace(/\[\d+\]/g, '');

const getInitialFormData = (content?: ContentWithoutId): ContentWithoutId => ({
  title: content?.title || '',
  description: content?.description || '',
  posterUrl: content?.posterUrl || '',
  backdropUrl: content?.backdropUrl || '',
  trailerUrl: content?.trailerUrl || '',
  openDate: content?.openDate || '',
  runningTime: content?.runningTime || 0,
  episode: content?.episode || 0,
  rating: content?.rating || '',
  categories: content?.categories || [{ categoryType: '영화', genres: [] }],
  countries: content?.countries || [],
  directors: content?.directors || [],
  casts: content?.casts || [],
  platforms: content?.platforms || [],
});

// ContentWithoutId를 ContentCreateUpdate로 변환하는 함수
const convertContentWithoutIdToContentCreateUpdate = (
  content: ContentWithoutId,
): ContentCreateUpdate => ({
  title: content.title,
  description: content.description,
  posterUrl: content.posterUrl,
  backdropUrl: content.backdropUrl,
  trailerUrl: content.trailerUrl,
  openDate: content.openDate,
  runningTime: content.runningTime,
  episode: content.episode,
  rating: content.rating,
  categories: content.categories,
  countries: content.countries,
  directors: content.directors.map((director) => director.directorId),
  casts: content.casts.map((cast) => cast.castId),
  platforms: content.platforms,
});

export default function ContentForm({
  content,
  onSave,
  onCancel,
  validationErrors,
  submitLabel,
}: ContentFormProps) {
  const [formData, setFormData] = useState<ContentWithoutId>(() =>
    getInitialFormData(content),
  );
  const showErrorToast = useErrorToastOnce();

  // 서버 검증 실패 필드 lookup. 필드명이 'platforms.0.watchUrl', 'platforms.watchUrl', 'platforms' 등
  // 어느 깊이로 와도 prefix 매칭으로 잡힘.
  // 백엔드는 인덱스를 붙여 보낸다(예: 'categories[0].genres[1]'). 인덱스를 뺀 경로
  // ('categories.genres')로도 찾을 수 있게 정규화해서 한 번 더 비교한다.
  const getFieldError = useMemo(() => {
    if (!validationErrors || validationErrors.length === 0) {
      return () => undefined;
    }
    return (fieldPath: string): JobValidationError | undefined => {
      return validationErrors.find(
        (e) =>
          e.field === fieldPath ||
          e.field.startsWith(`${fieldPath}.`) ||
          e.field.startsWith(`${fieldPath}[`) ||
          normalizeFieldPath(e.field) === fieldPath ||
          normalizeFieldPath(e.field).startsWith(`${fieldPath}.`),
      );
    };
  }, [validationErrors]);

  // 서버 검증 실패가 오면 맨 위의 오류 요약으로 올려서 무엇이 틀렸는지 먼저 읽게 한다.
  // 틀린 입력으로의 이동은 요약의 바로가기 아이콘으로 직접 한다.
  const formRef = useRef<HTMLFormElement>(null);
  const errorBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!validationErrors || validationErrors.length === 0) return;
    const frame = requestAnimationFrame(() => {
      errorBoxRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [validationErrors]);

  const jumpToField = useCallback((anchorId: string) => {
    const target = formRef.current?.querySelector<HTMLElement>(`#${anchorId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (target.matches('input, textarea, select, button')) {
      target.focus({ preventScroll: true });
    }
  }, []);

  const [isActorSearchOpen, setIsActorSearchOpen] = useState(false);
  const [isDirectorSearchOpen, setIsDirectorSearchOpen] = useState(false);

  const [newPlatform, setNewPlatform] = useState<PlatformInfo>({
    platformType: '',
    watchUrl: '',
  });

  // 이미지 업로드 훅
  const uploadImagesMutation = usePostUploadImages();

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    files: FileList | null,
    imageType: 'poster' | 'backdrop',
  ) => {
    if (!files || files.length === 0) return;

    try {
      const fileArray = Array.from(files);
      const response = await uploadImagesMutation.mutateAsync(fileArray);

      if (response.data.uploadedFileUrls.length > 0) {
        const uploadedUrl = response.data.uploadedFileUrls[0];
        updateFormData((prev) => ({
          ...prev,
          [imageType === 'poster' ? 'posterUrl' : 'backdropUrl']: uploadedUrl,
        }));
      }
    } catch {
      showSimpleToast.error({ message: '이미지 업로드에 실패했습니다.' });
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errorMessage = validateFormData(formData);
    if (errorMessage) {
      showSimpleToast.error({ message: errorMessage });
      return;
    }

    // 날짜 형식 정규화
    let normalizedDate = formData.openDate;
    if (formData.openDate && formData.openDate.trim() !== '') {
      normalizedDate = formData.openDate.includes('T00:00:00')
        ? formData.openDate
        : formData.openDate + 'T00:00:00';
    }

    // ContentWithoutId를 ContentCreateUpdate로 변환하여 저장
    const contentToSave = convertContentWithoutIdToContentCreateUpdate({
      ...formData,
      openDate: normalizedDate,
    });

    onSave(contentToSave);
  };

  // 폼 데이터 업데이트 헬퍼 함수
  const updateFormData = useCallback(
    (updater: (prev: ContentWithoutId) => ContentWithoutId) => {
      setFormData(updater);
    },
    [],
  );

  // 장르 관리
  const addGenre = useCallback(
    (selectedGenre: string) => {
      if (!selectedGenre.trim()) return;

      updateFormData((prev) => {
        const currentGenres = prev.categories[0]?.genres || [];
        if (currentGenres.includes(selectedGenre)) return prev;

        const updatedCategories = prev.categories.map((cat, index) =>
          index === 0
            ? { ...cat, genres: [...cat.genres, selectedGenre] }
            : cat,
        );
        return { ...prev, categories: updatedCategories };
      });
    },
    [updateFormData],
  );

  const removeGenre = useCallback(
    (genreToRemove: string) => {
      updateFormData((prev) => {
        const updatedCategories = prev.categories.map((cat, index) =>
          index === 0
            ? { ...cat, genres: cat.genres.filter((g) => g !== genreToRemove) }
            : cat,
        );
        return { ...prev, categories: updatedCategories };
      });
    },
    [updateFormData],
  );

  // 국가 관리
  const addCountry = useCallback(
    (selected: string) => {
      updateFormData((prev) => {
        if (!prev.countries.includes(selected)) {
          return { ...prev, countries: [...prev.countries, selected] };
        }
        return prev;
      });
    },
    [updateFormData],
  );

  const removeCountry = useCallback(
    (countryToRemove: string) => {
      updateFormData((prev) => ({
        ...prev,
        countries: prev.countries.filter((c) => c !== countryToRemove),
      }));
    },
    [updateFormData],
  );

  const removeDirector = useCallback(
    (directorIdToRemove: number) => {
      updateFormData((prev) => ({
        ...prev,
        directors: prev.directors.filter(
          (d) => d.directorId !== directorIdToRemove,
        ),
      }));
    },
    [updateFormData],
  );

  const removeCast = useCallback(
    (castIdToRemove: number) => {
      updateFormData((prev) => ({
        ...prev,
        casts: prev.casts.filter((c) => c.castId !== castIdToRemove),
      }));
    },
    [updateFormData],
  );

  // 플랫폼 관리
  const addPlatform = useCallback(() => {
    if (!newPlatform.platformType.trim() || !newPlatform.watchUrl.trim()) {
      showErrorToast('플랫폼과 URL을 모두 입력해주세요');
      return;
    }

    // URL 유효성 검사
    try {
      new URL(newPlatform.watchUrl);
    } catch {
      showErrorToast('올바른 URL을 입력해주세요');
      return;
    }

    updateFormData((prev) => ({
      ...prev,
      platforms: [...prev.platforms, newPlatform],
    }));
    setNewPlatform({ platformType: '', watchUrl: '' });
  }, [newPlatform, updateFormData, showErrorToast]);

  const removePlatform = useCallback(
    (index: number) => {
      updateFormData((prev) => ({
        ...prev,
        platforms: prev.platforms.filter((_, i) => i !== index),
      }));
    },
    [updateFormData],
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {validationErrors && validationErrors.length > 0 && (
        <div
          ref={errorBoxRef}
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertCircle className="size-4" />
            입력한 내용을 다시 확인해 주세요 ({validationErrors.length}건)
          </div>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {validationErrors.map((err, idx) => {
              const { target, reason } = describeValidationError(err, formData);
              const anchorId = getErrorAnchorId(err.field);
              return (
                <li
                  key={`${err.field}-${idx}`}
                  title={err.code}
                  className="flex items-start gap-2"
                >
                  <span className="flex-1">
                    <span className="font-medium">{target}</span>
                    <span className="mx-1">·</span>
                    {reason}
                  </span>
                  {anchorId && (
                    <button
                      type="button"
                      aria-label={`${target} 입력으로 이동`}
                      title="해당 입력으로 이동"
                      onClick={() => jumpToField(anchorId)}
                      className="shrink-0 cursor-pointer rounded-full p-1 text-red-700 hover:bg-red-100"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Tabs defaultValue="contentInfo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contentInfo" className="cursor-pointer">
            콘텐츠 등록
          </TabsTrigger>
          <TabsTrigger value="personRegistration" className="cursor-pointer">
            인물 등록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contentInfo" className="space-y-6 mt-3">
          {/* 기본 정보 */}
          <BasicInfo
            formData={formData}
            updateFormData={updateFormData}
            handleImageUpload={handleImageUpload}
            uploadImagesMutation={uploadImagesMutation}
            getFieldError={getFieldError}
          />

          {/* 상세 정보 */}
          <DetailedInfo
            formData={formData}
            updateFormData={updateFormData}
            addGenre={addGenre}
            removeGenre={removeGenre}
            addCountry={addCountry}
            removeCountry={removeCountry}
            getFieldError={getFieldError}
          />

          {/* 감독 정보 */}
          <DirectorInfo
            formData={formData}
            setIsDirectorSearchOpen={setIsDirectorSearchOpen}
            removeDirector={removeDirector}
            getFieldError={getFieldError}
          />

          {/* 출연진 정보 */}
          <CastInfo
            formData={formData}
            setIsActorSearchOpen={setIsActorSearchOpen}
            removeCast={removeCast}
            getFieldError={getFieldError}
          />

          {/* 시청 플랫폼 */}
          <PlatformSection
            formData={formData}
            newPlatform={newPlatform}
            setNewPlatform={setNewPlatform}
            addPlatform={addPlatform}
            removePlatform={removePlatform}
            getFieldError={getFieldError}
          />

          {/* 배우 검색 다이얼로그 */}
          <ActorSearchDialog
            open={isActorSearchOpen}
            onOpenChange={setIsActorSearchOpen}
            onSelectCasts={(casts) => {
              setFormData({
                ...formData,
                casts: [...formData.casts, ...casts],
              });
            }}
            existingCasts={formData.casts}
          />

          {/* 감독 검색 다이얼로그 */}
          <DirectorSearchDialog
            open={isDirectorSearchOpen}
            onOpenChange={setIsDirectorSearchOpen}
            onSelectDirectors={(directors) => {
              setFormData({
                ...formData,
                directors: [...formData.directors, ...directors],
              });
            }}
            existingDirectors={formData.directors}
          />

          {/* 취소/수정 버튼 */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="cursor-pointer"
            >
              취소
            </Button>
            <Button type="submit" className="cursor-pointer">
              {submitLabel ?? (content ? '수정' : '추가')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="personRegistration" className="space-y-6 mt-3">
          <BulkPersonRegistration />
        </TabsContent>
      </Tabs>
    </form>
  );
}
