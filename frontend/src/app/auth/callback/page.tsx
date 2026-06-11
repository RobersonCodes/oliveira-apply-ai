'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      window.location.href = '/auth/login?error=' + error;
      return;
    }

    if (token && refresh) {
      setTokens(token, refresh);
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth/login?error=oauth';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 size={32} className="text-brand-400 animate-spin mx-auto" />
        <p className="text-white/50 text-sm">Conectando com LinkedIn...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080812] flex items-center justify-center">
        <Loader2 size={32} className="text-brand-400 animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
