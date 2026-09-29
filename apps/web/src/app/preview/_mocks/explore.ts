import type {
  RecentContentData,
  SimpleContentData,
} from '@type/explore/Explore';
import type { PreviewSeed } from './PreviewQueryProvider';

// 원격 도메인(S3/kakao) 미설정 환경에서도 항상 렌더되는 로컬 포스터.
// 실제 데이터에 가깝게 보려면 S3 URL 로 교체하면 된다.
const POSTER = '/images/default-poster.png';

export const mockLatestContents: RecentContentData[] = [
  {
    contentId: 101,
    title: '인터스텔라',
    posterUrl: POSTER,
    categories: ['영화'],
    genres: ['SF', '드라마'],
  },
  {
    contentId: 102,
    title: '오징어 게임',
    posterUrl: POSTER,
    categories: ['시리즈'],
    genres: ['스릴러'],
  },
  {
    contentId: 103,
    title: '라라랜드',
    posterUrl: POSTER,
    categories: ['영화'],
    genres: ['로맨스', '뮤지컬'],
  },
  {
    contentId: 104,
    title: '기생충',
    posterUrl: POSTER,
    categories: ['영화'],
    genres: ['드라마'],
  },
  {
    contentId: 105,
    title: '더 글로리',
    posterUrl: POSTER,
    categories: ['시리즈'],
    genres: ['복수극'],
  },
];

const simple = (id: number, title: string): SimpleContentData => ({
  contentId: id,
  title,
  posterUrl: POSTER,
});

export const mockPopularContents: SimpleContentData[] = [
  simple(201, '범죄도시4'),
  simple(202, '파묘'),
  simple(203, '듄: 파트2'),
  simple(204, '서울의 봄'),
  simple(205, '웡카'),
  simple(206, '아쿠아맨'),
];

export const mockTodayRecommendContents: SimpleContentData[] = [
  simple(301, '미드나잇 인 파리'),
  simple(302, '소울'),
  simple(303, '코코'),
  simple(304, '인사이드 아웃'),
  simple(305, '월-E'),
  simple(306, '업'),
];

export const mockPlatformPicksContents: SimpleContentData[] = [
  simple(401, '더 베어'),
  simple(402, '성난 사람들'),
  simple(403, '비프'),
  simple(404, '슬기로운 의사생활'),
  simple(405, '무빙'),
  simple(406, '마스크걸'),
];

// preview/explore 가 캐시에 심을 시드 — 실제 explore RSC 가 prefetch 하는 쿼리키와 동일.
export const exploreSeeds: PreviewSeed[] = [
  { queryKey: ['latestContents'], data: mockLatestContents },
  { queryKey: ['popularContents'], data: mockPopularContents },
  { queryKey: ['todayRecommendContents'], data: mockTodayRecommendContents },
  { queryKey: ['platformPicksContents'], data: mockPlatformPicksContents },
];
