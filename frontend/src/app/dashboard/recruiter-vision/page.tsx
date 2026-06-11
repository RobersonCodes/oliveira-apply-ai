'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Zap, CheckCircle, AlertTriangle, XCircle, ChevronRight, Loader2, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const ATS_COLORS: Record<string, string> = {
  greenhouse: 'text-green-400',
  lever: 'text-blue-400',
  gupy: 'text-purple-400',
  workday: 'text-yellow-400',
  taleo: 'text-red-400',
  icims: 'text-cyan-400',
  generic: 'text-white/50',
};

export default function RecruiterVisionPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [form, setForm] = useState({ resumeContent: '', jobDescription: '', jobTitle: '', company: '', applyUrl: '' });
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!form.resumeContent || !form.jobDescription || !form.company) {
      toast.error('Preencha currículo, vaga e empresa');
      return;
    }
    setStep('loading');
    try {
      const { data } = await api.post('/recruiter-vision/analyze', form);
      setResult(data.data);
      setStep('result');
    } catch {
      toast.error('Erro na análise. Tente novamente.');
      setStep('form');
    }
  }

  function reset() { setStep('form'); setResult(null); }

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-500/10 border-green-500/20' : s >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-brand-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiter Vision</h1>
          <p className="text-white/50 text-sm mt-0.5">Detecta o ATS da empresa e otimiza seu currículo para passar nos filtros</p>
        </div>
        <span className="ml-auto badge-info text-xs">Pro</span>
      </div>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Shield size={14} className="text-brand-400" />Dados da vaga</h3>
              <div>
                <label className="label">Empresa *</label>
                <input className="input-field" placeholder="Ex: Nubank, iFood, Totvs..." value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input className="input-field" placeholder="Ex: Software Engineer Senior" value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} />
              </div>
              <div>
                <label className="label">URL da vaga</label>
                <input className="input-field" placeholder="https://..." value={form.applyUrl} onChange={e => setForm(p => ({ ...p, applyUrl: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descrição da vaga *</label>
                <textarea rows={6} className="input-field resize-none" placeholder="Cole aqui o texto completo da vaga..." value={form.jobDescription} onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))} />
              </div>
            </div>
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Zap size={14} className="text-brand-400" />Seu currículo</h3>
              <div className="flex-1">
                <label className="label">Conteúdo do currículo *</label>
                <textarea rows={15} className="input-field resize-none" placeholder="Cole o texto do seu currículo aqui. Quanto mais completo, melhor a análise..." value={form.resumeContent} onChange={e => setForm(p => ({ ...p, resumeContent: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAnalyze} className="btn-primary gap-2">
              <Search size={16} />
              Analisar e otimizar currículo
            </button>
          </div>
        </motion.div>
      )}

      {step === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-16 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-brand-600/20 border border-brand-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-lg">Analisando com IA...</div>
            <div className="text-white/40 text-sm mt-1">Detectando ATS, gaps e otimizando palavras-chave</div>
          </div>
        </motion.div>
      )}

      {step === 'result' && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Score cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Score ATS', value: result.atsScore ?? result.scores?.overall ?? 0, suffix: '/100' },
              { label: 'Palavras-chave', value: result.keywordMatch ?? result.scores?.keywords ?? 0, suffix: '%' },
              { label: 'Compatibilidade', value: result.compatibilityScore ?? result.scores?.compatibility ?? 0, suffix: '%' },
              { label: 'Chance aprovação', value: result.approvalChance ?? result.scores?.approval ?? 0, suffix: '%' },
            ].map(({ label, value, suffix }) => (
              <div key={label} className={`glass rounded-xl p-4 border ${scoreBg(value)}`}>
                <div className="text-xs text-white/40 mb-1">{label}</div>
                <div className={`text-3xl font-bold ${scoreColor(value)}`}>{Math.round(value)}<span className="text-sm font-normal text-white/40">{suffix}</span></div>
              </div>
            ))}
          </div>

          {/* ATS detected */}
          {result.atsSystem && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-brand-400" />
                <div>
                  <div className="text-sm text-white/50">ATS detectado</div>
                  <div className={`text-lg font-bold capitalize ${ATS_COLORS[result.atsSystem?.toLowerCase()] ?? 'text-white'}`}>
                    {result.atsSystem}
                  </div>
                </div>
                {result.atsConfidence && (
                  <span className="ml-auto badge-info text-xs">{Math.round(result.atsConfidence * 100)}% confiança</span>
                )}
              </div>
              {result.atsNotes && <p className="text-sm text-white/50 mt-3 border-t border-white/[0.06] pt-3">{result.atsNotes}</p>}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Keywords encontradas */}
            {result.foundKeywords?.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CheckCircle size={14} className="text-green-400" />Palavras-chave encontradas</h3>
                <div className="flex flex-wrap gap-2">
                  {result.foundKeywords.map((kw: string) => (
                    <span key={kw} className="badge-success text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords faltando */}
            {result.missingKeywords?.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><XCircle size={14} className="text-red-400" />Adicionar ao currículo</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw: string) => (
                    <span key={kw} className="badge-danger text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sugestões */}
          {result.suggestions?.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-400" />Sugestões de melhoria</h3>
              <div className="space-y-3">
                {result.suggestions.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                    <ChevronRight size={14} className="text-brand-400 mt-0.5 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currículo otimizado */}
          {result.optimizedResume && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Zap size={14} className="text-brand-400" />Currículo otimizado pela IA</h3>
                <button onClick={() => { navigator.clipboard.writeText(result.optimizedResume); toast.success('Copiado!'); }} className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5">
                  <Copy size={12} />Copiar
                </button>
              </div>
              <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono bg-white/[0.03] rounded-xl p-4 max-h-64 overflow-y-auto">{result.optimizedResume}</pre>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={reset} className="btn-secondary gap-2"><Search size={14} />Nova análise</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
