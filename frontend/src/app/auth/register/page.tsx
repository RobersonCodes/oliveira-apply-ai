'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Fraca', 'Média', 'Forte'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    window.location.href = '/dashboard';
  };

  const benefits = [
    '10 candidaturas grátis para testar',
    '7 dias de trial no plano Pro',
    'Sem cartão de crédito necessário',
  ];

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold">OA</div>
            <span className="font-semibold text-white text-lg">Oliveira Apply AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Crie sua conta grátis</h1>
          <p className="text-white/50 text-sm">Comece a automatizar suas candidaturas hoje</p>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-2 mb-6">
          {benefits.map(b => (
            <div key={b} className="flex items-center gap-2 text-sm text-white/60">
              <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Seu nome" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex gap-1.5">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-white/10'}`} />
                  ))}
                  <span className={`text-xs ml-1 ${passwordStrength === 3 ? 'text-emerald-400' : passwordStrength === 2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {strengthLabel[passwordStrength]}
                  </span>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Criando conta...</> : <>Criar conta grátis <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Entrar</Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Ao criar conta, você concorda com os{' '}
          <a href="#" className="underline hover:text-white/40">Termos</a> e{' '}
          <a href="#" className="underline hover:text-white/40">Privacidade</a>
        </p>
      </div>
    </div>
  );
}
