'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ProfilePage from '@app/profile/page';
import type { UserProfile } from '@udt/shared/types/auth/UserProfile';

const MOCK_PROFILE: UserProfile = {
  name: '미리보기 사용자',
  email: 'preview@example.com',
  profileImageUrl: '/images/default-profile.png',
  platforms: ['NETFLIX', 'DISNEY_PLUS', 'WATCHA'],
  genres: ['액션', 'SF', '드라마'],
};

export default function PreviewProfilePage() {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // useGetUserProfile의 queryKey ['userProfile']에 mock 응답 주입.
    qc.setQueryData(['userProfile'], MOCK_PROFILE);
    setReady(true);
  }, [qc]);

  if (!ready) return null;

  return (
    <div className="relative w-full min-h-[100svh]">
      <div className="sticky top-0 z-[100] bg-yellow-400/90 text-black text-xs text-center py-1">
        🧪 Preview — profile (mock user, react-query cache 주입)
      </div>
      <ProfilePage />
    </div>
  );
}
