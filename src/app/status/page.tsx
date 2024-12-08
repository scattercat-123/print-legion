'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function StatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Status Page - Session Status:', status);
    console.log('Status Page - Session Data:', session);

    if (status === 'unauthenticated') {
      console.log('Status Page - User is unauthenticated, redirecting to home');
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      console.log('Status Page - User is authenticated');
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  console.log('Status Page - Rendering loading state');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
} 