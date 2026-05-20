'use client';

import OnboardingClient from '@app/onboarding/OnboardingClient';
import PreviewBanner from '@app/preview/PreviewBanner';

export default function PreviewOnboardingPage() {
  return (
    <div className="relative w-full h-full">
      <PreviewBanner label="onboarding (mock 데이터)" />
      <OnboardingClient />
    </div>
  );
}
