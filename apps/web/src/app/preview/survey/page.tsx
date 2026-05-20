'use client';

import { useEffect, useState } from 'react';
import Step1 from '@components/survey/Step1';
import Step2 from '@components/survey/Step2';
import SurveyComplete from '@components/survey/SurveyComplete';
import { useSurveyStore } from '@store/useSurveyStore';
import PreviewBanner from '@app/preview/PreviewBanner';

// 인증 없이 설문 화면을 mock 상태로 확인.
// 실제 SurveyFlow는 step 쿼리 없으면 /survey?step=1 로 강제 replace하므로
// preview에서는 Step1/Step2/SurveyComplete를 직접 자체 step 상태로 렌더.
export default function PreviewSurveyPage() {
  const [step, setStep] = useState(1);
  const setPlatforms = useSurveyStore((s) => s.setPlatforms);
  const setGenres = useSurveyStore((s) => s.setGenres);
  const setContentIds = useSurveyStore((s) => s.setContentIds);

  useEffect(() => {
    setPlatforms(['NETFLIX', 'DISNEY_PLUS']);
    setGenres(['액션', 'SF']);
    setContentIds([]);
  }, [setPlatforms, setGenres, setContentIds]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  return (
    <div className="relative w-full h-full">
      <PreviewBanner label={`survey · step ${step}/3 · mock store`} />
      {step === 1 && <Step1 onNext={handleNext} />}
      {step === 2 && <Step2 onNext={handleNext} />}
      {step === 3 && <SurveyComplete />}
    </div>
  );
}
