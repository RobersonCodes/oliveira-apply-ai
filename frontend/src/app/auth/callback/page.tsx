'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      window.location.href = '/auth/login?error=' + error;
      return;
    }

    // O backend já setou os cookies httpOnly de sessão no redirect — só falta
    // confirmar a sessão e puxar o csrfToken pra memória via /auth/me.
    (async () => {
      await fetchMe();
      if (useAuthStore.getState().isAuthenticated) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/auth/login?error=oauth';
      }
    })();
  }, [searchParams, fetchMe]);

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
