'use client';
import { useState } from 'react';
import {
  Zap, Play, Pause, Square, Settings2, Bot, Clock,
  CheckCircle2, AlertCircle, Loader2, ChevronDown,
  Linkedin, Globe, Filter, Target, Shield, BarChart2,
} from 'lucide-react';

const seniorityOptions = ['Junior', 'Pleno', 'Senior', 'Lead', 'Manager'];
const jobTypeOptions = ['CLT', 'PJ', 'Freelance', 'Estágio'];
const stackOptions = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript', 'Next.js', 'NestJS'];

const runningLogs = [
  { time: '09:45:12', level: 'success', msg: '✅ Aplicado: Senior Frontend @ Nubank' },
  { time: '09:43:55', level: 'info',    msg: '🔍 Analisando vaga: React Developer @ iFood (score: 87%)' },
  { time: '09:42:30', level: 'info',    msg: '⏳ Aguardando 23s antes da próxima candidatura...' },
  { time: '09:41:07', level: 'success', msg: '✅ Aplicado: Tech Lead @ PicPay' },
  { time: '09:39:44', level: 'warning', msg: '⚠️ Vaga ignorada: score baixo (42%) — Backend Engineer @ StartupXYZ' },
  { time: '09:38:20', level: 'success', msg: '✅ Aplicado: Full Stack @ Mercado Livre' },
  { time: '09:37:01', level: 'info',    msg: '🔐 Login LinkedIn realizado com sucesso' },
  { time: '09:36:45', level: 'info',    msg: '🚀 Automação iniciada' },
];

const logColors: Record<string, string> = {
  success: 'text-emerald-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
};

type AutoStatus = 'idle' | 'running' | 'paused';

export default function ApplyPage() {
  const [status, setStatus] = useState<AutoStatus>('running');
  const [keywords, setKeywords] = useState('Senior Frontend Developer React');
  const [location, setLocation] = useState('Brasil');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [easyApplyOnly, setEasyApplyOnly] = useState(true);
  const [maxApps, setMaxApps] = useState(50);
  const [minScore, setMinScore] = useState(65);
  const [selectedSeniority, setSelectedSeniority] = useState(['Senior', 'Lead']);
  const [selectedStack, setSelectedStack] = useState(['React', 'TypeScript', 'Next.js']);
  const [coverLetter, setCoverLetter] = useState(true);
  const [adaptResume, setAdaptResume] = useState(true);

  const toggleTag = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auto Apply</h1>
          <p className="text-white/50 text-sm mt-1">Configure e monitore suas automações de candidatura</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* LinkedIn Account */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Linkedin size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Conta LinkedIn</h3>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">in</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">oliveira@email.com</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400">Conectado e ativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Config */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <Filter size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Filtros de busca</h3>
            </div>

            <div>
              <label className="label">Palavras-chave</label>
              <input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="input-field"
                placeholder="Ex: Senior React Developer"
              />
            </div>
            <div>
              <label className="label">Localização</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input-field"
                placeholder="Ex: São Paulo, Brasil"
              />
            </div>

            <div>
              <label className="label">Senioridade</label>
              <div className="flex flex-wrap gap-2">
                {seniorityOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleTag(selectedSeniority, setSelectedSeniority, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedSeniority.includes(s)
                        ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Stack / Tecnologias</label>
              <div className="flex flex-wrap gap-2">
                {stackOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleTag(selectedStack, setSelectedStack, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedStack.includes(s)
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              {[
                { label: 'Apenas remoto', sub: 'Filtrar somente vagas remotas', value: remoteOnly, set: setRemoteOnly },
                { label: 'Easy Apply apenas', sub: 'Somente vagas com candidatura rápida', value: easyApplyOnly, set: setEasyApplyOnly },
                { label: 'Cover Letter com IA', sub: 'Gerar carta personalizada para cada vaga', value: coverLetter, set: setCoverLetter },
                { label: 'Adaptar currículo', sub: 'IA adapta o currículo para cada vaga', value: adaptResume, set: setAdaptResume },
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{t.label}</div>
                    <div className="text-xs text-white/40">{t.sub}</div>
                  </div>
                  <button
                    onClick={() => t.set(!t.value)}
                    className={`w-10 h-5.5 rounded-full transition-all duration-300 relative ${t.value ? 'bg-brand-500' : 'bg-white/10'}`}
                    style={{ height: 22 }}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${t.value ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <Shield size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Anti-detecção</h3>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Máximo de candidaturas</label>
                <span className="text-sm font-medium text-brand-400">{maxApps}</span>
              </div>
              <input
                type="range" min={5} max={200} value={maxApps}
                onChange={e => setMaxApps(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Score mínimo IA</label>
                <span className="text-sm font-medium text-brand-400">{minScore}%</span>
              </div>
              <input
                type="range" min={30} max={95} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 space-y-1">
              <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-400" /> Delays humanizados (15-45s)</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-400" /> Mouse movement simulado</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-400" /> Fingerprint management</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-400" /> Rotação de User-Agent</div>
            </div>
          </div>
        </div>

        {/* Right Panel: Status + Logs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Status Card */}
          <div className={`glass rounded-2xl p-6 ${status === 'running' ? 'border-brand-500/20 bg-brand-500/[0.03]' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  status === 'running' ? 'bg-brand-500/20 border border-brand-500/30' : 'bg-white/[0.05] border border-white/[0.08]'
                }`}>
                  {status === 'running'
                    ? <Loader2 size={18} className="text-brand-400 animate-spin" />
                    : <Bot size={18} className="text-white/50" />
                  }
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {status === 'running' ? 'Automação executando' : status === 'paused' ? 'Automação pausada' : 'Pronto para iniciar'}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {status === 'running' ? 'Senior Frontend Developer · Brasil · Remoto' : 'Configure os filtros e inicie'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === 'running' && (
                  <button onClick={() => setStatus('paused')} className="btn-secondary gap-1.5 text-xs px-3 py-2">
                    <Pause size={12} /> Pausar
                  </button>
                )}
                {status === 'paused' && (
                  <button onClick={() => setStatus('running')} className="btn-primary gap-1.5 text-xs px-3 py-2">
                    <Play size={12} /> Retomar
                  </button>
                )}
                {status !== 'idle' && (
                  <button onClick={() => setStatus('idle')} className="btn-danger gap-1.5 text-xs px-3 py-2">
                    <Square size={12} /> Parar
                  </button>
                )}
                {status === 'idle' && (
                  <button onClick={() => setStatus('running')} className="btn-primary gap-2 px-5">
                    <Play size={14} /> Iniciar automação
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            {status !== 'idle' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Encontradas', value: 47, color: 'text-white' },
                    { label: 'Aplicadas', value: 12, color: 'text-brand-400' },
                    { label: 'Ignoradas', value: 8, color: 'text-amber-400' },
                    { label: 'Falharam', value: 1, color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                    <span>Progresso</span>
                    <span>12 / {maxApps} candidaturas</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(12 / maxApps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-white/50" />
                <h3 className="text-sm font-semibold text-white">Log em tempo real</h3>
                {status === 'running' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <button className="text-xs text-white/30 hover:text-white/60 transition-colors">Limpar</button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs max-h-64 overflow-y-auto scrollbar-none">
              {runningLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 hover:bg-white/[0.02] rounded px-1 py-0.5">
                  <span className="text-white/25 shrink-0 tabular-nums">{log.time}</span>
                  <span className={logColors[log.level]}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
