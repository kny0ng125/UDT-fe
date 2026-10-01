'use client';

import { useEffect } from 'react';
import ContentForm from '@components/ContentForm';
import PreviewBanner from '@app/preview/PreviewBanner';
import type { ContentWithoutId } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';

// 서버 검증 실패(INVALID) 시 폼이 어떻게 보이는지 확인하기 위한 mock 데이터.
const MOCK_CONTENT: ContentWithoutId = {
  title: '[예시] 검증 실패 확인용 영화',
  description: '서버 검증에서 걸리는 값이 들어 있는 mock 콘텐츠입니다.',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: '',
  openDate: '2025-01-01',
  runningTime: 120,
  episode: 0,
  rating: '15세 이상 관람가',
  categories: [{ categoryType: '영화', genres: ['액션', '없는장르'] }],
  countries: ['한국'],
  directors: [],
  casts: [{ castId: 999999, castName: '존재하지 않는 배우', castImageUrl: '' }],
  platforms: [{ platformType: '없는플랫폼', watchUrl: 'https://example.com' }],
};

const MOCK_ERRORS: JobValidationError[] = [
  {
    field: 'categories[0].genres[1]',
    value: '없는장르',
    code: 'GENRE_TYPE_BAD_REQUEST',
    message: '올바르지 않은 장르 타입입니다.',
  },
  {
    field: 'platforms[0].platformType',
    value: '없는플랫폼',
    code: 'PLATFORM_TYPE_BAD_REQUEST',
    message: '올바르지 않은 플랫폼 타입입니다.',
  },
  {
    field: 'casts[0]',
    value: '999999',
    code: 'CAST_NOT_FOUND',
    message: '출연진을 찾을 수 없습니다.',
  },
];

export default function PreviewContentFormErrorsPage() {
  // 상단 고정 배너에 가려지지 않게, 스크롤 이동 시 배너 높이만큼 여백을 둔다.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = '7rem';
    return () => {
      root.style.scrollPaddingTop = prev;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewBanner
        title="콘텐츠 등록 폼 — 검증 실패"
        description="서버 검증 실패(INVALID) 안내와 바로가기 아이콘 mock 화면"
      />
      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
        <ContentForm
          content={MOCK_CONTENT}
          validationErrors={MOCK_ERRORS}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </main>
    </div>
  );
}
