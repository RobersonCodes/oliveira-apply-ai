'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oliveira-apply-ai-production.up.railway.app';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = () => {
    window.location.href = `${BACKEND_URL}/api/auth/linkedin`;
  };

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-glow-sm">
              OA
            </div>
            <span className="font-semibold text-white text-lg">Oliveira Apply AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-white/50 text-sm">Entre na sua conta para continuar</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <button onClick={handleLinkedIn} className="w-full btn-secondary gap-2.5 justify-center mb-6 py-3 hover:bg-[#0077B5]/20 hover:border-[#0077B5]/40 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Entrar com LinkedIn
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/30">ou continue com email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label mb-0">Senha</label>
              <div className="relative mt-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Entrando...</>
                : <>Entrar <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Criar conta grátis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Ao entrar, você concorda com os{' '}
          <Link href="/termos" className="underline hover:text-white/40 transition-colors">Termos de Uso</Link>
          {' '}e{' '}
          <Link href="/privacidade" className="underline hover:text-white/40 transition-colors">Privacidade</Link>
        </p>
      </div>
    </div>
  );
}