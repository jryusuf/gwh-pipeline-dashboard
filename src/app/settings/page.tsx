"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRequireAuth } from '@/lib/use-auth';
import { SettingsHeader } from '@/components/settings-header';
import { ProfileSettingsCard } from '@/components/profile-settings-card';
import { PasswordChangeCard } from '@/components/password-change-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Header } from '@/components/header';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { isLoading: requireAuthLoading } = useRequireAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !requireAuthLoading) {
      setLoading(false);
    }
  }, [authLoading, requireAuthLoading]);

  if (authLoading || requireAuthLoading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect
  }

  if (loading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
        <div className="max-w-3xl">
          <SettingsHeader />
          
          <div className="mt-8">
            <ProfileSettingsCard user={user} />
          </div>
          
          <div className="mt-8">
            <PasswordChangeCard />
          </div>
        </div>
      </main>
    </div>
  );
}