import { cookies } from 'next/headers';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import ProfileClient from './ProfileClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function fetchUserProfileOnServer() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to prefetch user profile: ${res.status}`);
  }
  return res.json();
}

export default async function ProfilePage() {
  const queryClient = new QueryClient();

  // prefetchQuery는 queryFn 실패해도 throw하지 않음 → 클라이언트가 재시도
  await queryClient.prefetchQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfileOnServer,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileClient />
    </HydrationBoundary>
  );
}
