"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Loading } from '@/components/ui/loading';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/api/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <Loading message="Autenticando..." variant="circles" size="md" className="min-h-screen" />
    );
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen flex-col w-full">
            <AppHeader />
            <div className="flex flex-1">
                <AppSidebar />
                <SidebarInset className="p-4 md:p-6 lg:p-8">
                    {children}
                </SidebarInset>
            </div>
            </div>
        </SidebarProvider>
    </NextThemesProvider>
  );
}
