'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2, Github, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
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

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="btn-secondary gap-2 justify-center">
              <Chrome size={15} className="text-blue-400" /> Google
            </button>
            <button className="btn-secondary gap-2 justify-center">
              <Github size={15} /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/30">ou continue com email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
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
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Senha</label>
                <Link href="/auth/forgot" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
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
          <a href="#" className="underline hover:text-white/40 transition-colors">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="underline hover:text-white/40 transition-colors">Privacidade</a>
        </p>
      </div>
    </div>
  );
}
