'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StartScreen } from './onBoardingStart';
import TutorialStep from './TutorialStep';
import { TUTORIAL_STEPS } from './tutorialSteps';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import Step8 from './Step8';
import { usePageStayTracker } from '@udt/shared/hooks/usePageStayTracker';
import { ProgressDots } from '@components/common/ProgressDots';

const POST_TUTORIAL_STEP_COUNT = 4; // Step5, 6, 7, 8
const TOTAL_STEPS = TUTORIAL_STEPS.length + POST_TUTORIAL_STEP_COUNT;

export default function OnboardingPage() {
  usePageStayTracker('onboarding');

  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get('step');
  const step = useMemo(() => {
    const parsed = parseInt(stepParam ?? '');
    if (isNaN(parsed) || parsed < 0 || parsed >= TOTAL_STEPS) return null;
    return parsed;
  }, [stepParam]);

  const goToStep = (nextStep: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('step', nextStep.toString());
    router.push(`/onboarding?${newSearchParams.toString()}`);
  };

  const handleStart = () => goToStep(0);
  const handleNext = () => {
    if (step !== null && step < TOTAL_STEPS - 1) goToStep(step + 1);
  };
  const handleComplete = () => {
    // isNewUser 쿠키 제거 (만료 시간을 과거로)
    document.cookie =
      'X-New-User=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/recommend');
  };

  if (step === null) return <StartScreen onStart={handleStart} />;

  const renderStep = () => {
    // 0~(TUTORIAL_STEPS.length-1): 튜토리얼 step
    if (step < TUTORIAL_STEPS.length) {
      return <TutorialStep {...TUTORIAL_STEPS[step]} onNext={handleNext} />;
    }
    // 그 뒤는 고유 로직 step
    const idxAfterTutorial = step - TUTORIAL_STEPS.length;
    switch (idxAfterTutorial) {
      case 0:
        return <Step5 onNext={handleNext} />;
      case 1:
        return <Step6 onNext={handleNext} />;
      case 2:
        return <Step7 onNext={handleNext} />;
      case 3:
        return <Step8 onNext={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 right-0 w-full max-w-[640px] mx-auto z-50 px-6 pt-6">
        <ProgressDots currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>
      <div className="w-full h-full">{renderStep()}</div>
    </div>
  );
}
