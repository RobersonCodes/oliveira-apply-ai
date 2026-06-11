'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ghost, Zap, CheckCircle, XCircle, AlertTriangle, Loader2, ChevronRight, User, Building2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const SENIORITY_OPTIONS = ['INTERN','JUNIOR','MID','SENIOR','LEAD','MANAGER'];

export default function ShadowApplyPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [form, setForm] = useState({ targetRole: '', targetCompany: '', jobDescription: '', seniorityLevel: 'MID', location: '' });
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!form.targetRole || !form.targetCompany || !form.jobDescription) {
      toast.error('Preencha cargo, empresa e descrição');
      return;
    }
    setStep('loading');
    try {
      const { data } = await api.post('/shadow-apply/full-analysis', {
        ...form,
        jobData: { postedDate: new Date().toISOString(), applicantCount: 0 },
      });
      setResult(data.data);
      setStep('result');
    } catch {
      toast.error('Erro na análise. Tente novamente.');
      setStep('form');
    }
  }

  const recColor = (rec: string) => rec === 'apply_now' ? 'text-green-400' : 'text-red-400';
  const recBg = (rec: string) => rec === 'apply_now' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
  const recLabel = (rec: string) => rec === 'apply_now' ? '✅ Candidatar agora' : '⏸ Pular esta vaga';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          <Ghost className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Shadow Apply</h1>
          <p className="text-white/50 text-sm mt-0.5">Cria uma persona sintética para testar a receptividade da vaga antes de você aplicar</p>
        </div>
        <span className="ml-auto badge-info text-xs">Pro</span>
      </div>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Building2 size={14} className="text-brand-400" />Dados da oportunidade</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cargo *</label>
                <input className="input-field" placeholder="Ex: Product Manager, Dev Senior..." value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} />
              </div>
              <div>
                <label className="label">Empresa *</label>
                <input className="input-field" placeholder="Ex: Nubank, Mercado Livre..." value={form.targetCompany} onChange={e => setForm(p => ({ ...p, targetCompany: e.target.value }))} />
              </div>
              <div>
                <label className="label">Senioridade</label>
                <select className="input-field" value={form.seniorityLevel} onChange={e => setForm(p => ({ ...p, seniorityLevel: e.target.value }))}>
                  {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Localização</label>
                <input className="input-field" placeholder="Ex: São Paulo, Remoto..." value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Descrição da vaga *</label>
              <textarea rows={8} className="input-field resize-none" placeholder="Cole o texto completo da vaga aqui. A IA vai criar uma persona ideal e testar a receptividade..." value={form.jobDescription} onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))} />
            </div>
          </div>

          <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-white/[0.06]">
            <Ghost size={16} className="text-brand-400 mt-0.5 shrink-0" />
            <div className="text-sm text-white/50">
              A IA cria uma persona com o perfil ideal para a vaga e analisa sinais de receptividade: se a vaga é real, se está recebendo candidatos, e qual a chance de resposta.
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleAnalyze} className="btn-primary gap-2">
              <Ghost size={16} />
              Criar persona e analisar
            </button>
          </div>
        </motion.div>
      )}

      {step === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-16 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-lg">Criando persona sintética...</div>
            <div className="text-white/40 text-sm mt-1">Analisando sinais de mercado e receptividade</div>
          </div>
        </motion.div>
      )}

      {step === 'result' && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Recomendação */}
          {result.recommendation && (
            <div className={`glass rounded-2xl p-6 border ${recBg(result.recommendation)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/40 mb-1">Recomendação da IA</div>
                  <div className={`text-xl font-bold ${recColor(result.recommendation)}`}>{recLabel(result.recommendation)}</div>
                </div>
                {result.signals?.receptivityScore !== undefined && (
                  <div className="text-right">
                    <div className="text-xs text-white/40">Score de receptividade</div>
                    <div className="text-3xl font-bold text-white">{Math.round(result.signals.receptivityScore * 100)}<span className="text-sm font-normal text-white/40">%</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Persona criada */}
            {result.persona && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><User size={14} className="text-brand-400" />Persona ideal criada</h3>
                <div className="space-y-3">
                  {result.persona.name && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-sm font-bold text-brand-300">
                        {result.persona.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{result.persona.name}</div>
                        <div className="text-xs text-white/40">{result.persona.headline || result.persona.title}</div>
                      </div>
                    </div>
                  )}
                  {result.persona.skills?.length > 0 && (
                    <div>
                      <div className="text-xs text-white/40 mb-2">Habilidades da persona</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.persona.skills.slice(0, 8).map((s: string) => (
                          <span key={s} className="badge-info text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.persona.summary && (
                    <p className="text-xs text-white/50 leading-relaxed border-t border-white/[0.06] pt-3">{result.persona.summary}</p>
                  )}
                </div>
              </div>
            )}

            {/* Sinais de mercado */}
            {result.signals && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-brand-400" />Sinais de receptividade</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Vaga real', value: result.signals.isRealOpening, icon: result.signals.isRealOpening ? CheckCircle : XCircle },
                    { label: 'Recrutador ativo', value: result.signals.recruiterActive, icon: result.signals.recruiterActive ? CheckCircle : AlertTriangle },
                    { label: 'Urgência de contratação', value: result.signals.urgentHiring, icon: result.signals.urgentHiring ? Zap : null },
                  ].filter(s => s.value !== undefined).map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-sm text-white/60">{label}</span>
                      {Icon && <Icon size={14} className={value ? 'text-green-400' : 'text-yellow-400'} />}
                    </div>
                  ))}
                  {result.signals.positiveSignals?.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                      <CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" />{s}
                    </div>
                  ))}
                  {result.signals.warningSignals?.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                      <AlertTriangle size={12} className="text-yellow-400 mt-0.5 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => { setStep('form'); setResult(null); }} className="btn-secondary gap-2"><Ghost size={14} />Nova análise</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
