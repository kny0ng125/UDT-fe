import { LoadingScreen } from '@components/common/LoadingScreen';

// 이동 중 즉시 보이는 화면. 동적 라우트라 loading.tsx 가 있어야 Link prefetch 때 이 화면까지 미리 받아 둔다.
export default function Loading() {
  return (
    <LoadingScreen
      message="콘텐츠를 불러오고 있어요!"
      submessage="잠시만 기다려주세요...."
    />
  );
}
