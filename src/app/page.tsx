"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { APP_NAME } from '@/lib/constants';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/api/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <Loading message={`Cargando ${APP_NAME}...`} variant="circles" size="md" className="min-h-screen" />
  );
}
