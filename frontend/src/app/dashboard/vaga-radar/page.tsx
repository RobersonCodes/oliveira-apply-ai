'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Zap, TrendingUp, AlertTriangle, Loader2, Building2,
  ChevronRight, Sparkles, Search, MapPin, ExternalLink, Briefcase,
  Filter, X, CheckCircle2, XCircle, Target, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api, resumeApi, extractError } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Config ───────────────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<string, string> = {
  funding_round: 'badge-success', leadership_hire: 'badge-info',
  product_launch: 'badge-info', expansion: 'badge-success',
  layoff_recovery: 'badge-warning', ipo_preparation: 'badge-success',
  acquisition: 'badge-info', tech_migration: 'badge-info',
  regulatory_compliance: 'badge-warning', competitor_move: 'badge-warning',
};
const SIGNAL_LABELS: Record<string, string> = {
  funding_round: '💰 Rodada de Investimento', leadership_hire: '👔 Nova Liderança',
  product_launch: '🚀 Lançamento de Produto', expansion: '📈 Expansão',
  layoff_recovery: '🔄 Recuperação após Cortes', ipo_preparation: '📊 Preparação para IPO',
  acquisition: '🤝 Aquisição', tech_migration: '⚙️ Migração Tecnológica',
  regulatory_compliance: '⚖️ Compliance', competitor_move: '⚔️ Movimento do Concorrente',
};
const SOURCE_COLORS: Record<string, string> = {
  indeed:   'bg-[#2164F3]/10 border-[#2164F3]/30 text-[#5B8EF5]',
  infojobs: 'bg-[#FF6600]/10 border-[#FF6600]/30 text-[#FF8833]',
  linkedin: 'bg-[#0077B5]/10 border-[#0077B5]/30 text-[#4BA3CC]',
};

function scoreColor(score: number) {
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'border-emerald-500/40' };
  if (score >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400', ring: 'border-yellow-500/40' };
  return { bar: 'bg-red-500', text: 'text-red-400', ring: 'border-red-500/40' };
}

// ─── Score Panel ──────────────────────────────────────────────────────────────

function ScorePanel({
  job,
  onClose,
}: {
  job: any;
  onClose: () => void;
}) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ matchScore: number; notes: string; skills: string[] } | null>(null);
  const [error, setError]       = useState('');
  const [noResume, setNoResume] = useState(false);

  async function analyze() {
    setLoading(true);
    setError('');
    try {
      // Buscar currículo padrão
      const { data: resumeData } = await resumeApi.list();
      const resumes = resumeData.data || [];
      const defaultResume = resumes.find((r: any) => r.isDefault) || resumes[0];

      if (!defaultResume?.rawText) {
        setNoResume(true);
        setLoading(false);
        return;
      }

      const { data } = await api.post('/resumes/analyze-match', {
        resumeContent: defaultResume.rawText,
        jobDescription: job.description || `${job.title} na empresa ${job.company}`,
        jobTitle: job.title,
      });

      setResult(data.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const colors = result ? scoreColor(result.matchScore) : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-3 pt-3 border-t border-white/[0.06]">

        {/* Inicial — botão de analisar */}
        {!result && !loading && !noResume && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">Veja sua compatibilidade com esta vaga antes de candidatar.</p>
            <button
              onClick={analyze}
              className="btn-primary text-xs gap-1.5 py-2 px-3"
            >
              <Target size={13} />
              Ver compatibilidade
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 size={16} className="animate-spin text-brand-400" />
            <p className="text-xs text-white/50">Analisando compatibilidade com IA...</p>
          </div>
        )}

        {/* Sem currículo */}
        {noResume && (
          <div className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-yellow-300">Você ainda não tem currículo cadastrado.</p>
            <a href="/dashboard/resume" className="text-xs text-brand-400 hover:underline">
              Ir para Currículo IA →
            </a>
          </div>
        )}

        {/* Erro */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Resultado */}
        {result && colors && (
          <div className="space-y-3">
            {/* Score */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border bg-white/[0.02] ${colors.ring}`}>
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={result.matchScore >= 75 ? '#10b981' : result.matchScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="5"
                    strokeDasharray={`${(result.matchScore / 100) * 138.2} 138.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${colors.text}`}>{result.matchScore}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${colors.text}`}>
                    {result.matchScore >= 75 ? '🎯 Ótimo match!' :
                     result.matchScore >= 50 ? '⚡ Match razoável' :
                     '📉 Match baixo'}
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{result.notes}</p>
              </div>
            </div>

            {/* Skills */}
            {result.skills && result.skills.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Habilidades detectadas na vaga</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills.map((skill: string) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ação */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs gap-1.5 py-2 px-3"
              >
                <ExternalLink size={12} />
                {result.matchScore >= 50 ? 'Candidatar agora' : 'Ver vaga mesmo assim'}
              </a>
              <button
                onClick={() => { setResult(null); setError(''); }}
                className="text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Reanalisar
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function VagaRadarPage() {
  const [mainTab, setMainTab] = useState<'search' | 'signals'>('search');

  // Job search state
  const [searchForm, setSearchForm] = useState({ query: '', location: '', sources: ['indeed', 'infojobs'] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [expandedScore, setExpandedScore] = useState<number | null>(null);

  // Signal analysis state
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [form, setForm] = useState({ company: '', newsText: '', targetRoles: '' });
  const [result, setResult] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  async function handleSearchJobs() {
    if (!searchForm.query.trim()) { toast.error('Digite o cargo ou palavra-chave'); return; }
    setSearchLoading(true);
    setSearched(true);
    setExpandedScore(null);
    try {
      const { data } = await api.post('/vaga-radar/search-jobs', {
        query: searchForm.query,
        location: searchForm.location,
        sources: searchForm.sources,
        limit: 15,
      });
      setJobs(data.data || []);
      if ((data.data || []).length === 0) toast('Nenhuma vaga encontrada. Tente outros termos.', { icon: '🔍' });
    } catch {
      toast.error('Erro na busca. Tente novamente.');
    } finally {
      setSearchLoading(false);
    }
  }

  function toggleSource(source: string) {
    setSearchForm(p => ({
      ...p,
      sources: p.sources.includes(source) ? p.sources.filter(s => s !== source) : [...p.sources, source],
    }));
  }

  async function handleAnalyze() {
    if (!form.company || !form.newsText) { toast.error('Preencha empresa e notícias/contexto'); return; }
    setStep('loading'); setIsDemo(false);
    try {
      const payload: any = { company: form.company, newsText: form.newsText };
      if (form.targetRoles) payload.targetRoles = form.targetRoles.split(',').map(r => r.trim());
      const { data } = await api.post('/vaga-radar/analyze', payload);
      setResult(data.data); setStep('result');
    } catch { toast.error('Erro na análise.'); setStep('form'); }
  }

  async function handleDemo() {
    setStep('loading'); setIsDemo(true);
    try {
      const { data } = await api.get('/vaga-radar/demo');
      setResult(data.data); setStep('result');
    } catch { toast.error('Erro ao carregar demo.'); setStep('form'); }
  }

  const urgencyColor = (u: string) =>
    u === 'high'   ? 'text-green-400 bg-green-500/10 border-green-500/20' :
    u === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                     'text-white/40 bg-white/[0.04] border-white/[0.08]';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Radar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Vaga Radar</h1>
          <p className="text-white/50 text-sm mt-0.5">Busque vagas no Indeed e InfoJobs ou detecte sinais de mercado com IA</p>
        </div>
        <span className="ml-auto badge-info text-xs">Pro</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        <button onClick={() => setMainTab('search')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mainTab === 'search' ? 'bg-brand-500/20 text-brand-300' : 'text-white/40 hover:text-white/70'}`}>
          <span className="flex items-center gap-2"><Search size={14} />Buscar Vagas</span>
        </button>
        <button onClick={() => setMainTab('signals')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mainTab === 'signals' ? 'bg-brand-500/20 text-brand-300' : 'text-white/40 hover:text-white/70'}`}>
          <span className="flex items-center gap-2"><Radar size={14} />Sinais de Mercado</span>
        </button>
      </div>

      {/* JOB SEARCH TAB */}
      {mainTab === 'search' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cargo ou palavra-chave *</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input className="input-field pl-9" placeholder="Ex: Desenvolvedor React, UX Designer..." value={searchForm.query} onChange={e => setSearchForm(p => ({ ...p, query: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSearchJobs()} />
                </div>
              </div>
              <div>
                <label className="label">Localização</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input className="input-field pl-9" placeholder="Ex: São Paulo, SP — ou deixe em branco" value={searchForm.location} onChange={e => setSearchForm(p => ({ ...p, location: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSearchJobs()} />
                </div>
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-2"><Filter size={13} />Fontes</label>
              <div className="flex gap-2">
                {[
                  { id: 'indeed',   label: 'Indeed',   color: 'hover:bg-[#2164F3]/10 hover:border-[#2164F3]/30' },
                  { id: 'infojobs', label: 'InfoJobs', color: 'hover:bg-[#FF6600]/10 hover:border-[#FF6600]/30' },
                ].map(s => (
                  <button key={s.id} onClick={() => toggleSource(s.id)} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${searchForm.sources.includes(s.id) ? SOURCE_COLORS[s.id] : 'border-white/[0.08] text-white/30'} ${s.color}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSearchJobs} disabled={searchLoading || searchForm.sources.length === 0} className="btn-primary gap-2">
              {searchLoading ? <><Loader2 size={15} className="animate-spin" />Buscando...</> : <><Search size={15} />Buscar vagas</>}
            </button>
          </div>

          {searchLoading && (
            <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4">
              <Loader2 size={28} className="animate-spin text-cyan-400" />
              <p className="text-white/40 text-sm">Buscando vagas em {searchForm.sources.join(' e ')}...</p>
            </div>
          )}

          {!searchLoading && searched && jobs.length === 0 && (
            <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
              <Briefcase size={32} className="text-white/20" />
              <p className="text-white/50 text-sm">Nenhuma vaga encontrada para "{searchForm.query}".</p>
              <p className="text-white/30 text-xs">Tente termos mais genéricos ou outra localização.</p>
            </div>
          )}

          {!searchLoading && jobs.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs text-white/30">{jobs.length} vagas encontradas</div>
              {jobs.map((job, i) => (
                <div key={job.id || i} className="glass rounded-2xl p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${SOURCE_COLORS[job.source] || 'badge-info'}`}>
                          {job.source === 'indeed' ? 'Indeed' : job.source === 'infojobs' ? 'InfoJobs' : 'LinkedIn'}
                        </span>
                        {job.jobType && <span className="text-xs text-white/30">{job.jobType}</span>}
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">{job.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Building2 size={11} />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                        {job.salary && <span className="text-emerald-400">{job.salary}</span>}
                      </div>
                      {job.description && <p className="text-xs text-white/40 mt-2 line-clamp-2">{job.description}</p>}
                      {job.postedAt && <p className="text-xs text-white/20 mt-1">{job.postedAt}</p>}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs gap-1.5">
                        Ver vaga <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => setExpandedScore(expandedScore === i ? null : i)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                          expandedScore === i
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                            : 'border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <Target size={12} />
                        {expandedScore === i ? 'Fechar' : 'Match'}
                        {expandedScore === i ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Score panel expandível */}
                  <AnimatePresence>
                    {expandedScore === i && (
                      <ScorePanel job={job} onClose={() => setExpandedScore(null)} />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* SIGNALS TAB */}
      {mainTab === 'signals' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {step === 'form' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Building2 size={14} className="text-brand-400" />Empresa a monitorar</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome da empresa *</label>
                    <input className="input-field" placeholder="Ex: Nubank, Mercado Livre..." value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Cargos de interesse (separados por vírgula)</label>
                    <input className="input-field" placeholder="Ex: Software Engineer, DevOps..." value={form.targetRoles} onChange={e => setForm(p => ({ ...p, targetRoles: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Notícias ou contexto sobre a empresa *</label>
                  <textarea rows={6} className="input-field resize-none" placeholder="Cole notícias, comunicados, posts do LinkedIn sobre a empresa..." value={form.newsText} onChange={e => setForm(p => ({ ...p, newsText: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button onClick={handleDemo} className="btn-ghost gap-2 text-sm"><Sparkles size={14} className="text-brand-400" />Ver demo</button>
                <button onClick={handleAnalyze} className="btn-primary gap-2"><Radar size={16} />Analisar sinais</button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="glass rounded-2xl p-16 flex flex-col items-center gap-6">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-center">
                <div className="text-white font-semibold">Varrendo sinais de mercado...</div>
                <div className="text-white/40 text-sm mt-1">Analisando padrões de contratação</div>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              {isDemo && <div className="glass rounded-xl p-3 border border-brand-500/20 flex items-center gap-2 text-sm text-brand-300"><Sparkles size={14} />Modo demo — dados de exemplo</div>}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div><div className="text-xs text-white/40 mb-1">Sinais detectados</div><div className="text-3xl font-bold text-white">{result.alerts?.length ?? 0}</div></div>
                  <div className="text-right"><div className="text-xs text-white/40 mb-1">Janela de oportunidade</div><div className="text-sm font-semibold text-brand-300">Próximos 30-90 dias</div></div>
                </div>
              </div>
              {result.alerts?.map((alert: any, i: number) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SIGNAL_COLORS[alert.signalType] ?? 'badge-info'}`}>{SIGNAL_LABELS[alert.signalType] ?? alert.signalType}</span>
                      <h4 className="text-sm font-semibold text-white mt-2">{alert.title ?? alert.headline}</h4>
                    </div>
                    {alert.urgency && <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${urgencyColor(alert.urgency)}`}>{alert.urgency === 'high' ? '🔥 Alta urgência' : alert.urgency === 'medium' ? '⚡ Urgência média' : 'Baixa urgência'}</span>}
                  </div>
                  {alert.description && <p className="text-sm text-white/60 mb-3">{alert.description}</p>}
                  {alert.hiringImplication && <div className="bg-brand-500/[0.06] border border-brand-500/15 rounded-xl p-3 flex items-start gap-2"><TrendingUp size={13} className="text-brand-400 mt-0.5 shrink-0" /><p className="text-xs text-white/60">{alert.hiringImplication}</p></div>}
                  {alert.recommendedActions?.map((a: string, j: number) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-white/50 mt-2"><ChevronRight size={12} className="text-brand-400 mt-0.5 shrink-0" />{a}</div>
                  ))}
                </div>
              ))}
              {result.alerts?.length === 0 && <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center"><AlertTriangle size={32} className="text-white/20" /><p className="text-white/50 text-sm">Nenhum sinal detectado.</p></div>}
              <div className="flex justify-end"><button onClick={() => { setStep('form'); setResult(null); }} className="btn-secondary gap-2"><Radar size={14} />Nova análise</button></div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
