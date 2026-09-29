import type { TicketComponent } from '@type/recommend/TicketComponent';

const POSTER = '/images/default-poster.png';
const BACKDROP = '/images/default-backdrop.png';

const ticket = (
  id: number,
  title: string,
  genres: string[],
  category = '영화',
): TicketComponent => ({
  contentId: id,
  title,
  description:
    '미리보기용 mock 콘텐츠입니다. 백엔드/인증 없이 카드 UI와 스와이프 흐름을 확인합니다.',
  posterUrl: POSTER,
  backdropUrl: BACKDROP,
  openDate: '2026-01-01',
  runningTime: 120,
  episode: '0',
  rating: '15세',
  category,
  genres,
  directors: ['샘플 감독'],
  casts: ['샘플 배우 1', '샘플 배우 2'],
  platforms: ['NETFLIX'],
  watchUrls: ['https://example.com/watch'],
});

// recommend phase 의 스와이프 풀 (zustand moviePool 로 시딩)
export const mockMoviePool: TicketComponent[] = [
  ticket(1001, '인터스텔라', ['SF', '드라마']),
  ticket(1002, '오징어 게임', ['스릴러'], '시리즈'),
  ticket(1003, '라라랜드', ['로맨스', '뮤지컬']),
  ticket(1004, '기생충', ['드라마']),
  ticket(1005, '더 글로리', ['복수극'], '시리즈'),
  ticket(1006, '파묘', ['오컬트']),
  ticket(1007, '듄: 파트2', ['SF']),
  ticket(1008, '서울의 봄', ['드라마']),
  ticket(1009, '소울', ['애니'], '영화'),
  ticket(1010, '무빙', ['액션'], '시리즈'),
];

// result phase 의 큐레이트 결과 (react-query ['curatedContents', ...] 로 시딩)
export const mockCuratedContents: TicketComponent[] = [
  ticket(2001, '코코', ['애니', '가족']),
  ticket(2002, '인사이드 아웃', ['애니']),
  ticket(2003, '위플래쉬', ['드라마', '음악']),
  ticket(2004, '그랜드 부다페스트 호텔', ['코미디']),
  ticket(2005, '미드나잇 인 파리', ['로맨스']),
];
