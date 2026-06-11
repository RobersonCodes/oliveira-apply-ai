'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useAuth(redirectIfUnauthenticated = false) {
  const { user, isAuthenticated, isLoading, error, logout, fetchMe, clearError } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (redirectIfUnauthenticated && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, redirectIfUnauthenticated]);

  return { user, isAuthenticated, isLoading, error, logout, clearError };
}

export function useRequireAuth() {
  return useAuth(true);
}

export function useIsAdmin() {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN';
}

export function usePlan() {
  const { user } = useAuthStore();
  const plan = user?.subscription?.plan || 'FREE';
  return {
    plan,
    isFree: plan === 'FREE',
    isStarter: plan === 'STARTER',
    isPro: plan === 'PRO',
    isEnterprise: plan === 'ENTERPRISE',
    isPremium: ['PRO', 'ENTERPRISE'].includes(plan),
  };
}
