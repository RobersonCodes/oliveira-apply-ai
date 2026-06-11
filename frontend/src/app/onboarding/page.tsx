'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Upload, Linkedin, Globe, FileText, Zap, Loader2 } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import toast from 'react-hot-toast';

const steps = [
  { id: 'welcome',     label: 'Boas-vindas',     icon: Zap },
  { id: 'resume',      label: 'Currículo',        icon: FileText },
  { id: 'platforms',   label: 'Plataformas',      icon: Globe },
  { id: 'done',        label: 'Pronto!',          icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploaded(true);
      toast.success('Currículo enviado!');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_done', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold mx-auto mb-4">OA</div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo ao Oliveira Apply AI</h1>
          <p className="text-white/50 text-sm mt-2">Configure sua conta em 3 passos rápidos</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-brand-500 text-white' :
                'bg-white/[0.06] text-white/30'
              }`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px transition-all ${i < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="glass rounded-2xl p-8">

          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
                <Zap size={28} className="text-brand-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Automatize suas candidaturas</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  O Oliveira Apply AI vai buscar vagas, adaptar seu currículo com IA e se candidatar automaticamente nas principais plataformas — enquanto você faz outras coisas.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { value: '10x', label: 'mais candidaturas' },
                  { value: '68%', label: 'taxa de resposta' },
                  { value: '< 5min', label: 'para configurar' },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-lg font-bold text-brand-400">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="btn-primary w-full justify-center gap-2 py-3">
                Começar <ArrowRight size={15} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Envie seu currículo</h2>
                <p className="text-white/50 text-sm">A IA vai adaptar seu currículo para cada vaga automaticamente</p>
              </div>

              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                className="hidden"
                onChange={handleFileUpload}
              />

              {uploaded ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">Currículo enviado!</div>
                    <div className="text-xs text-white/40">Pronto para adaptação com IA</div>
                  </div>
                </div>
              ) : (
                <label htmlFor="resume-upload" className={`block w-full p-8 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all ${uploading ? 'border-brand-500/40 bg-brand-500/5' : 'border-white/10 hover:border-brand-500/30 hover:bg-brand-500/[0.03]'}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="text-brand-400 animate-spin" />
                      <span className="text-sm text-white/50">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-white/30" />
                      <span className="text-sm text-white/50">Clique para enviar seu currículo</span>
                      <span className="text-xs text-white/25">PDF, DOC, DOCX, TXT, RTF</span>
                    </div>
                  )}
                </label>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Pular por agora</button>
                <button onClick={() => setStep(2)} disabled={!uploaded} className="btn-primary flex-1 justify-center gap-2">
                  Continuar <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Globe size={24} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Conecte suas plataformas</h2>
                <p className="text-white/50 text-sm">Você pode conectar agora ou fazer isso depois em Configurações</p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', short: 'in', desc: 'Candidaturas automáticas' },
                  { id: 'indeed', label: 'Indeed', color: '#003A9B', short: 'IN', desc: 'Maior buscador de empregos' },
                  { id: 'catho', label: 'Catho', color: '#E8000D', short: 'CA', desc: 'Maior plataforma do Brasil' },
                ].map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: p.color }}>
                      {p.short}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{p.label}</div>
                      <div className="text-xs text-white/40">{p.desc}</div>
                    </div>
                    <span className="text-xs text-white/30">Conectar depois →</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">Pular</button>
                <button onClick={() => { router.push('/dashboard/connections'); }} className="btn-primary flex-1 justify-center gap-2">
                  Conectar agora <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Tudo pronto! 🎉</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Sua conta está configurada. Acesse o dashboard para começar a automatizar suas candidaturas.
                </p>
              </div>
              <div className="space-y-2 text-left">
                {[
                  'Busca automática de vagas em 8+ plataformas',
                  'Currículo adaptado com IA para cada vaga',
                  'Candidaturas automáticas com anti-detecção',
                  'Analytics em tempo real das suas candidaturas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={handleFinish} className="btn-primary w-full justify-center gap-2 py-3">
                Ir para o Dashboard <ArrowRight size={15} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
