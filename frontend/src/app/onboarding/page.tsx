'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api, extractError } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormData {
  jobTitle: string;
  area: string;
  minSalary: string;
  workRegime: string;
  city: string;
  state: string;
  remoteOnly: boolean;
  autoApplyEnabled: boolean;
  platforms: string[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const REGIMES = ['CLT', 'PJ', 'Remoto', 'Híbrido'];

const PLATFORMS = [
  { id: 'LinkedIn', label: 'LinkedIn', color: '#0A66C2', short: 'in' },
  { id: 'Indeed',   label: 'Indeed',   color: '#003A9B', short: 'ID' },
  { id: 'InfoJobs', label: 'InfoJobs', color: '#FF6B00', short: 'IJ' },
  { id: 'Gupy',     label: 'Gupy',     color: '#00C48C', short: 'GU' },
  { id: 'Catho',    label: 'Catho',    color: '#E8000D', short: 'CA' },
];

const AREAS = [
  'Tecnologia', 'Design', 'Marketing', 'Vendas', 'Financeiro',
  'RH', 'Jurídico', 'Operações', 'Saúde', 'Educação', 'Outro',
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

const STEP_LABELS = [
  'Cargo',
  'Salário',
  'Localização',
  'Currículo',
  'Plataformas',
];

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, fetchMe } = useAuthStore();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState<FormData>({
    jobTitle: '',
    area: '',
    minSalary: '',
    workRegime: '',
    city: '',
    state: 'SP',
    remoteOnly: false,
    autoApplyEnabled: false,
    platforms: [],
  });

  // ── Verificar auth + status do onboarding ─────────────────────────────────
  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem('accessToken')) {
        router.push('/auth/login');
        return;
      }
      if (!user) await fetchMe();
      try {
        const { data } = await api.get('/onboarding/status');
        if (data.data.onboardingCompleted) {
          router.push('/dashboard');
          return;
        }
      } catch {
        // erro na verificação → deixa continuar
      } finally {
        setChecking(false);
      }
    }
    init();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const togglePlatform = (id: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter(p => p !== id)
        : [...prev.platforms, id],
    }));
  };

  const canAdvance = () => {
    if (step === 1) return form.jobTitle.trim().length >= 2;
    if (step === 2) return form.workRegime !== '';
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/onboarding/complete', {
        jobTitle: form.jobTitle.trim(),
        area: form.area || undefined,
        minSalary: form.minSalary ? Number(form.minSalary.replace(/\D/g, '')) : undefined,
        workRegime: form.workRegime || undefined,
        city: form.city.trim() || undefined,
        state: form.state || undefined,
        remoteOnly: form.remoteOnly,
        autoApplyEnabled: form.autoApplyEnabled,
        platforms: form.platforms,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(extractError(err));
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-[#080812] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold mx-auto mb-4 text-white shadow-glow-sm">
            OA
          </div>
          <h1 className="text-2xl font-bold text-white">Oliveira Apply AI</h1>
          <p className="text-white/50 text-sm mt-1">Configure sua conta em {TOTAL_STEPS} passos</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done   ? 'bg-emerald-500 text-white' :
                    active ? 'bg-brand-500 text-white shadow-glow-sm' :
                             'bg-white/[0.06] text-white/30'
                  }`}>
                    {done ? <CheckCircle2 size={14} /> : n}
                  </div>
                  <span className={`text-[9px] font-medium hidden sm:block ${active ? 'text-brand-400' : 'text-white/25'}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-6 h-px mb-3 transition-all ${done ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
            initial={false}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Card */}
        <div className="glass rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              {step === 1 && <Step1 form={form} setForm={setForm} />}
              {step === 2 && <Step2 form={form} setForm={setForm} />}
              {step === 3 && <Step3 form={form} setForm={setForm} />}
              {step === 4 && <Step4 />}
              {step === 5 && <Step5 form={form} setForm={setForm} togglePlatform={togglePlatform} />}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-8">
            {error && (
              <p className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors text-sm font-medium"
                >
                  Voltar
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="btn-primary flex-1 justify-center gap-2 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continuar <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="btn-primary flex-1 justify-center gap-2 py-3 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>🚀 Começar a usar</>
                  )}
                </button>
              )}
            </div>

            {/* Skip — só passo 4 (currículo) */}
            {step === 4 && (
              <button
                onClick={handleNext}
                className="w-full mt-3 text-white/25 hover:text-white/40 text-xs transition-colors"
              >
                Pular por agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1 — Cargo ───────────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Qual cargo você busca?</h2>
        <p className="text-white/40 text-sm">Vamos personalizar as buscas de vaga para você.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">Cargo desejado *</label>
          <input
            type="text"
            placeholder="Ex: Desenvolvedor Full Stack, Designer UX..."
            value={form.jobTitle}
            onChange={e => setForm(prev => ({ ...prev, jobTitle: e.target.value }))}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">Área de atuação</label>
          <select
            value={form.area}
            onChange={e => setForm(prev => ({ ...prev, area: e.target.value }))}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
          >
            <option value="" className="bg-[#0a0a18]">Selecionar área...</option>
            {AREAS.map(a => <option key={a} value={a} className="bg-[#0a0a18]">{a}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Salário e regime ────────────────────────────────────────────────

function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const handleSalaryInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) { setForm(prev => ({ ...prev, minSalary: '' })); return; }
    setForm(prev => ({ ...prev, minSalary: Number(numbers).toLocaleString('pt-BR') }));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Salário e regime</h2>
        <p className="text-white/40 text-sm">Defina suas expectativas para filtrar melhor as vagas.</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">Salário mínimo desejado</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">R$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="5.000"
              value={form.minSalary}
              onChange={e => handleSalaryInput(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">Regime de trabalho *</label>
          <div className="grid grid-cols-2 gap-2">
            {REGIMES.map(regime => (
              <button
                key={regime}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, workRegime: regime }))}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  form.workRegime === regime
                    ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {regime}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Localização ─────────────────────────────────────────────────────

function Step3({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Onde quer trabalhar?</h2>
        <p className="text-white/40 text-sm">Usamos isso para filtrar vagas por localização.</p>
      </div>
      <div className="space-y-4">
        <label
          className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
          onClick={() => setForm(prev => ({ ...prev, remoteOnly: !prev.remoteOnly }))}
        >
          <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${form.remoteOnly ? 'bg-brand-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.remoteOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Somente vagas remotas</p>
            <p className="text-white/30 text-xs mt-0.5">Ignorar localização nas buscas</p>
          </div>
        </label>

        {!form.remoteOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div>
              <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo, Porto Alegre..."
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">Estado</label>
              <select
                value={form.state}
                onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              >
                {STATES.map(s => <option key={s} value={s} className="bg-[#0a0a18]">{s}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4 — Currículo ───────────────────────────────────────────────────────

function Step4() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Seu currículo</h2>
        <p className="text-white/40 text-sm">O upload completo está disponível no painel de Currículo IA.</p>
      </div>
      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-brand-500/30 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-white/50 text-sm mb-1">Upload de currículo (PDF)</p>
        <p className="text-white/25 text-xs">
          Disponível em <span className="text-brand-400">Dashboard → Currículo IA</span>
        </p>
      </div>
      <div className="mt-4 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
        <p className="text-brand-300/80 text-xs leading-relaxed">
          💡 Após o onboarding, acesse <strong>Currículo IA</strong> para fazer upload do seu PDF.
          A IA vai otimizar seu currículo para cada vaga automaticamente.
        </p>
      </div>
    </div>
  );
}

// ─── Step 5 — Plataformas e auto apply ────────────────────────────────────────

function Step5({
  form,
  setForm,
  togglePlatform,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  togglePlatform: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Plataformas e automação</h2>
        <p className="text-white/40 text-sm">Onde buscar vagas e se quer candidatura automática.</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">Plataformas ativas</label>
          <div className="space-y-2">
            {PLATFORMS.map(p => {
              const active = form.platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: p.color }}
                  >
                    {p.short}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${active ? 'text-white' : 'text-white/50'}`}>
                    {p.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    active ? 'border-brand-500 bg-brand-500' : 'border-white/20'
                  }`}>
                    {active && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <label
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => setForm(prev => ({ ...prev, autoApplyEnabled: !prev.autoApplyEnabled }))}
          >
            <div className={`relative mt-0.5 w-11 h-6 rounded-full flex-shrink-0 transition-colors ${form.autoApplyEnabled ? 'bg-brand-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.autoApplyEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Ativar Auto Apply</p>
              <p className="text-white/30 text-xs mt-0.5">A IA se candidata automaticamente às vagas que combinam com seu perfil.</p>
            </div>
          </label>
        </div>

        {/* Resumo */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium mb-2">Resumo</p>
          {[
            { label: 'Cargo', value: form.jobTitle || '—' },
            { label: 'Regime', value: form.workRegime || '—' },
            { label: 'Local', value: form.remoteOnly ? 'Remoto' : `${form.city || '—'} / ${form.state}` },
            { label: 'Salário mín.', value: form.minSalary ? `R$ ${form.minSalary}` : 'Não definido' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-xs">
              <span className="text-white/30">{item.label}</span>
              <span className="text-white/60 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
