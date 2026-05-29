'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, TrendingUp, Target, BarChart2,
  RefreshCw, ChevronRight, AlertCircle, CheckCircle,
  Sparkles, ArrowUp, ArrowDown, Minus, Settings
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NeuralStats {
  model: {
    totalSamples: number;
    accuracy: number;
    lastTrainedAt: string | null;
    scoreThreshold: number;
    featureImportance: Record<string, number>;
  } | null;
  predictions: Array<{
    id: string;
    jobTitle: string;
    company: string;
    score: number;
    confidence: number;
    shouldApply: boolean;
    reasoning: {
      topPositive: Array<{ feature: string; label: string; impact: number }>;
      topNegative: Array<{ feature: string; label: string; impact: number }>;
      summary: string;
    };
    createdAt: string;
  }>;
  stats: {
    avgPredictedScore: number;
    totalPredictions: number;
  };
}

const FEATURE_LABELS: Record<string, string> = {
  stackMatchScore: 'Match de Stack',
  titleSimilarity: 'Cargo Alvo',
  isRemote: 'Trabalho Remoto',
  seniorityLevel: 'Nível',
  hasSalary: 'Salário Info.',
  interviewedBefore: 'Entrevistou Antes',
  rejectedBefore: 'Rejeitado Antes',
  companySize: 'Porte Empresa',
  isEasyApply: 'Easy Apply',
  keywordDensity: 'Keywords',
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">{score}</span>
        <span className="text-xs text-text-muted">score</span>
      </div>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-brand-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-muted w-8">{pct}%</span>
    </div>
  );
}

export default function NeuralPage() {
  const [stats, setStats] = useState<NeuralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [testJob, setTestJob] = useState({ title: '', company: '', isRemote: false });
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'test' | 'settings'>('overview');

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const { data } = await api.get('/neural/stats');
      setStats(data.data);
      setThreshold(data.data.model?.scoreThreshold || 70);
    } catch {
      // mock data para demo
      setStats({
        model: {
          totalSamples: 47,
          accuracy: 0.78,
          lastTrainedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          scoreThreshold: 70,
          featureImportance: {
            stackMatchScore: 0.82, titleSimilarity: 0.71, isRemote: 0.65,
            seniorityLevel: 0.58, hasSalary: 0.44, interviewedBefore: 0.91,
            rejectedBefore: 0.88, companySize: 0.31, isEasyApply: 0.22, keywordDensity: 0.38,
          },
        },
        predictions: [
          { id: '1', jobTitle: 'Senior Backend Engineer', company: 'Nubank', score: 94, confidence: 0.85, shouldApply: true, reasoning: { topPositive: [{ feature: 'stackMatchScore', label: 'Match de Stack', impact: 0.45 }], topNegative: [], summary: 'Excelente match! Stack altamente compatível.' }, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
          { id: '2', jobTitle: 'Full Stack Developer', company: 'iFood', score: 78, confidence: 0.72, shouldApply: true, reasoning: { topPositive: [{ feature: 'isRemote', label: 'Remoto', impact: 0.3 }], topNegative: [{ feature: 'applicantCount', label: 'Muitos candidatos', impact: -0.2 }], summary: 'Bom match. Remoto joga a favor, mas há muita concorrência.' }, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
          { id: '3', jobTitle: 'Node.js Developer', company: 'Banco Inter', score: 45, confidence: 0.60, shouldApply: false, reasoning: { topPositive: [], topNegative: [{ feature: 'rejectedBefore', label: 'Rejeitado antes', impact: -0.5 }], summary: 'Score baixo. Você foi rejeitado nesta empresa anteriormente.' }, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
        ],
        stats: { avgPredictedScore: 72, totalPredictions: 134 },
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTrain() {
    setTraining(true);
    try {
      const { data } = await api.post('/neural/train');
      toast.success(data.message || 'Modelo treinado!');
      await fetchStats();
    } catch {
      toast.error('Erro ao treinar modelo');
    } finally {
      setTraining(false);
    }
  }

  async function handleTest() {
    if (!testJob.title || !testJob.company) {
      toast.error('Preencha título e empresa');
      return;
    }
    setTesting(true);
    try {
      const { data } = await api.post('/neural/predict', testJob);
      setTestResult(data.data);
    } catch {
      // mock
      setTestResult({
        score: Math.floor(Math.random() * 40) + 55,
        confidence: 0.65,
        shouldApply: true,
        reasoning: {
          topPositive: [{ label: 'Match de Stack', impact: 0.4 }, { label: 'Remoto', impact: 0.3 }],
          topNegative: [{ label: 'Muitos candidatos', impact: -0.15 }],
          summary: 'Bom match baseado no seu histórico.',
        },
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleThresholdSave() {
    try {
      await api.patch('/neural/threshold', { threshold });
      toast.success('Threshold atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    }
  }

  const featureData = stats?.model?.featureImportance
    ? Object.entries(stats.model.featureImportance)
        .map(([key, value]) => ({ feature: FEATURE_LABELS[key] || key, value: Math.round((value as number) * 100) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];

  const radarData = featureData.slice(0, 6).map(f => ({ subject: f.feature.split(' ')[0], value: f.value }));

  const accuracy = stats?.model?.accuracy ? Math.round(stats.model.accuracy * 100) : 0;
  const samples = stats?.model?.totalSamples || 0;
  const confidenceLevel = samples < 5 ? 'Iniciando' : samples < 20 ? 'Aprendendo' : samples < 50 ? 'Evoluindo' : 'Maduro';
  const confidenceColor = samples < 5 ? 'text-yellow-400' : samples < 20 ? 'text-brand-400' : samples < 50 ? 'text-purple-400' : 'text-green-400';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-brand-400" />
            <span className="text-sm text-brand-400 font-medium">Job Match Neural</span>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${confidenceColor} font-medium`}>
              {confidenceLevel}
            </span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Sua IA Pessoal</h1>
          <p className="text-text-muted mt-1">
            Aprende com seu histórico e prevê quais vagas têm mais chance de resposta
          </p>
        </div>
        <button
          onClick={handleTrain}
          disabled={training}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
          {training ? 'Treinando...' : 'Retreinar Modelo'}
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="stat-card h-28 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Amostras de Treino', value: samples, icon: Brain, color: 'text-brand-400', bg: 'bg-brand-500/10', sub: 'candidaturas analisadas' },
            { label: 'Precisão do Modelo', value: `${accuracy}%`, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', sub: accuracy >= 70 ? 'boa precisão' : 'melhorando...' },
            { label: 'Score Médio Previsto', value: stats?.stats.avgPredictedScore || 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: 'das suas vagas' },
            { label: 'Total de Predições', value: stats?.stats.totalPredictions || 0, icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/10', sub: 'vagas analisadas' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
              <div className={`p-2 rounded-lg ${card.bg} w-fit mb-3`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{card.value}</div>
              <div className="text-xs text-text-muted mt-1">{card.label}</div>
              <div className="text-xs text-text-muted/60 mt-0.5">{card.sub}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl w-fit">
        {([
          { id: 'overview', label: 'Visão Geral' },
          { id: 'predictions', label: 'Predições' },
          { id: 'test', label: 'Testar Vaga' },
          { id: 'settings', label: 'Configurar' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-brand-600 text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Importance Bar */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Feature Importance</h3>
              <p className="text-xs text-text-muted mb-5">O que mais influencia o score das suas vagas</p>
              <div className="space-y-3">
                {featureData.map((f, i) => (
                  <div key={f.feature} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-28 truncate">{f.feature}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: i < 3 ? '#6366f1' : i < 6 ? '#8b5cf6' : '#4f46e5' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.value}%` }}
                        transition={{ delay: i * 0.05, duration: 0.6 }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-8 text-right">{f.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Perfil do Modelo</h3>
              <p className="text-xs text-text-muted mb-4">Distribuição de pesos aprendidos</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Radar name="Importância" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-text-muted text-sm">Treine o modelo para ver o radar</p>
                </div>
              )}
            </div>

            {/* Model Health */}
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Saúde do Modelo</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-text-muted mb-2">Volume de dados</p>
                  <ConfidenceMeter confidence={Math.min(1, samples / 100)} />
                  <p className="text-xs text-text-muted mt-1">{samples} / 100 amostras ideais</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Precisão</p>
                  <ConfidenceMeter confidence={accuracy / 100} />
                  <p className="text-xs text-text-muted mt-1">{accuracy}% de acerto</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Último treino</p>
                  <p className="text-sm text-text-primary font-medium">
                    {stats?.model?.lastTrainedAt ? formatDate(stats.model.lastTrainedAt) : 'Nunca'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {samples < 10 ? 'Aplique mais vagas para melhorar' : 'Retreine semanalmente'}
                  </p>
                </div>
              </div>

              {samples < 10 && (
                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    Seu modelo ainda está aprendendo. Continue aplicando — com pelo menos 10 candidaturas com resultado, a precisão aumenta significativamente.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <motion.div key="predictions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border-primary">
              <h3 className="text-lg font-semibold text-text-primary">Últimas Predições</h3>
              <p className="text-xs text-text-muted mt-1">Vagas analisadas pela sua IA pessoal</p>
            </div>
            <div className="divide-y divide-border-primary">
              {stats?.predictions.map((pred, i) => (
                <motion.div key={pred.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-4">
                    <ScoreRing score={pred.score} size={72} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text-primary">{pred.jobTitle}</p>
                          <p className="text-sm text-text-muted">{pred.company}</p>
                        </div>
                        <span className={`badge flex-shrink-0 ${pred.shouldApply ? 'badge-success' : 'badge-danger'}`}>
                          {pred.shouldApply ? '✓ Aplicar' : '✗ Pular'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-2">{pred.reasoning.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pred.reasoning.topPositive.map(f => (
                          <span key={f.label} className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <ArrowUp className="w-3 h-3" />{f.label}
                          </span>
                        ))}
                        {pred.reasoning.topNegative.map(f => (
                          <span key={f.label} className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <ArrowDown className="w-3 h-3" />{f.label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-muted">Confiança:</span>
                        <div className="w-24"><ConfidenceMeter confidence={pred.confidence} /></div>
                        <span className="text-xs text-text-muted">{formatDate(pred.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <motion.div key="test" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Testar uma Vaga</h3>
              <p className="text-xs text-text-muted mb-5">Veja o score antes de aplicar</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Título da Vaga</label>
                  <input className="input-field" placeholder="Ex: Senior Backend Engineer" value={testJob.title} onChange={e => setTestJob(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Empresa</label>
                  <input className="input-field" placeholder="Ex: Nubank" value={testJob.company} onChange={e => setTestJob(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTestJob(p => ({ ...p, isRemote: !p.isRemote }))} className={`relative w-11 h-6 rounded-full transition-colors ${testJob.isRemote ? 'bg-brand-600' : 'bg-white/10'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${testJob.isRemote ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm text-text-secondary">Trabalho Remoto</span>
                </div>
                <button onClick={handleTest} disabled={testing} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Brain className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
                  {testing ? 'Analisando...' : 'Analisar com Neural'}
                </button>
              </div>
            </div>

            {testResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Resultado</h3>
                <div className="flex items-center gap-6 mb-6">
                  <ScoreRing score={testResult.score} size={100} />
                  <div>
                    <p className={`text-2xl font-bold ${testResult.shouldApply ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.shouldApply ? '✓ Aplicar' : '✗ Pular'}
                    </p>
                    <p className="text-sm text-text-muted mt-1">{testResult.reasoning.summary}</p>
                    <div className="mt-2">
                      <p className="text-xs text-text-muted mb-1">Confiança do modelo</p>
                      <div className="w-32"><ConfidenceMeter confidence={testResult.confidence} /></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {testResult.reasoning.topPositive.map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                      <ArrowUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-300">{f.label}</span>
                    </div>
                  ))}
                  {testResult.reasoning.topNegative.map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <ArrowDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-300">{f.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-6 max-w-lg">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Configurações do Modelo</h3>
            <p className="text-xs text-text-muted mb-6">Ajuste como a IA filtra vagas para você</p>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Score Mínimo para Aplicar</label>
                  <span className="text-lg font-bold text-brand-400">{threshold}</span>
                </div>
                <input type="range" min={30} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full accent-brand-500" />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>30 — aplica mais</span>
                  <span>95 — muito seletivo</span>
                </div>
                <p className="text-xs text-text-muted mt-3">
                  {threshold < 50 ? '⚠️ Muito permissivo — pode aplicar para vagas ruins' :
                   threshold < 70 ? '✓ Balanceado — bom volume com qualidade' :
                   threshold < 85 ? '✓ Seletivo — foca nas melhores vagas' :
                   '⚠️ Muito restritivo — pode perder boas oportunidades'}
                </p>
              </div>
              <button onClick={handleThresholdSave} className="btn-primary w-full">
                Salvar Configurações
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
