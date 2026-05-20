import rightSwipeLottie from '@/assets/Lottie/Swipe Gesture Right.json';
import leftSwipeLottie from '@/assets/Lottie/Swipe Gesture Left.json';
import upSwipeLottie from '@/assets/Lottie/Swipe Gesture Up.json';
import type { TutorialStepConfig } from './TutorialStep';

// 인덱스가 곧 Step 번호 (0~4) — 기존 Step0.tsx~Step4.tsx 구조를 그대로 옮겨옴.
export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    // Step0: 환영
    heading: (
      <>
        여러분의 선택을 바탕으로
        <br />
        취향에 꼭 맞는 콘텐츠를 추천드립니다!
      </>
    ),
  },
  {
    // Step1: 오른쪽 스와이프
    heading: <>좋아요! 한번 보고 싶은 컨텐츠라면?</>,
    subheading: <>오른쪽으로 넘겨 &lsquo;좋아요&rsquo;를 표시해 주세요</>,
    lottie: rightSwipeLottie,
  },
  {
    // Step2: 왼쪽 스와이프
    heading: <>싫어요! 별로인 컨텐츠라면?</>,
    subheading: <>왼쪽으로 넘겨 &lsquo;싫어요&rsquo; 표시해 주세요</>,
    lottie: leftSwipeLottie,
  },
  {
    // Step3: 위로 스와이프
    heading: <>관심없어...딱히 잘 모르겠다?</>,
    subheading: <>위로 쭉쭉 넘겨서 관심없음 처리해 주세요</>,
    helperText: (
      <>
        (키보드 방향키는 <span className="font-semibold">↑</span>를 눌러주세요)
      </>
    ),
    lottie: upSwipeLottie,
  },
  {
    // Step4: 상세보기
    heading: (
      <>
        추천 받은 컨텐츠의 상세 내용이 궁금하다면?
        <br />
        우측 상단 눈 아이콘으로 상세보기가 가능해요!
      </>
    ),
    allowFlip: true,
  },
];
