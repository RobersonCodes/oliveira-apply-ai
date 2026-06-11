'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase, TrendingUp, MessageSquare, CalendarCheck,
  ArrowRight, Zap, Bot, Target, CheckCircle2, XCircle, Eye,
  Loader2, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsApi, applicationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  APPLIED:   { label: 'Aplicado',    className: 'badge-info',    icon: CheckCircle2 },
  VIEWED:    { label: 'Visualizado', className: 'badge-purple',  icon: Eye },
  INTERVIEW: { label: 'Entrevista',  className: 'badge-success', icon: CalendarCheck },
  OFFER:     { label: 'Oferta 🎉',  className: 'badge-warning', icon: TrendingUp },
  REJECTED:  { label: 'Rejeitado',  className: 'badge-danger',  icon: XCircle },
  PENDING:   { label: 'Pendente',   className: 'badge-default', icon: Loader2 },
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#6366f1', VIEWED: '#8b5cf6', INTERVIEW: '#10b981',
  OFFER: '#f59e0b', REJECTED: '#ef4444', PENDING: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70 capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'bem-vindo';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  async function load() {
    setLoading(true);
    try {
      const [dashRes, chartsRes, appsRes] = await Promise.allSettled([
        analyticsApi.dashboard(),
        analyticsApi.charts(),
        applicationApi.list({ limit: 6, page: 1 }),
      ]);

      if (dashRes.status === 'fulfilled') setStats(dashRes.value.data.data);
      if (chartsRes.status === 'fulfilled') setCharts(chartsRes.value.data.data);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const kpis = [
    { icon: Briefcase,      label: 'Total Aplicações',  value: stats?.totalApplications ?? 0,   change: stats?.newThisWeek ? `+${stats.newThisWeek}` : null,   sub: 'este mês' },
    { icon: MessageSquare,  label: 'Taxa de Resposta',  value: `${stats?.responseRate ?? 0}%`,  change: null, sub: 'candidaturas respondidas' },
    { icon: CalendarCheck,  label: 'Entrevistas',       value: stats?.interviews ?? 0,           change: null, sub: 'agendadas' },
    { icon: Target,         label: 'Score Médio IA',    value: stats?.avgAiScore ? Math.round(stats.avgAiScore) : '—', change: null, sub: 'match score' },
  ];

  // Build status chart from applications
  const statusData = Object.entries(
    applications.reduce((acc: any, a: any) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] ?? '#6b7280' }));

  // Build trend data from charts or fallback
  const trendData = charts?.trend ?? charts?.applications ?? [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {firstName} 👋</h1>
          <p className="text-white/50 text-sm mt-1">Aqui está o resumo das suas candidaturas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-2" title="Atualizar">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/dashboard/apply" className="btn-primary gap-2 hidden sm:flex">
            <Zap size={15} />Nova automação
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => (
              <div key={k.label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <k.icon size={16} className="text-brand-400" />
                  {k.change && <span className="text-xs text-emerald-400">{k.change}</span>}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{k.value}</div>
                <div className="text-xs text-white/50">{k.label}</div>
                <div className="text-xs text-white/30 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend chart */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Progresso das Candidaturas</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="aplicações" stroke="#6366f1" fill="url(#gA)" strokeWidth={2} />
                    <Area type="monotone" dataKey="respostas" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <Bot size={32} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">Nenhuma candidatura ainda.</p>
                  <Link href="/dashboard/apply" className="btn-primary mt-4 gap-2 text-sm">
                    <Zap size={14} />Iniciar automação
                  </Link>
                </div>
              )}
            </div>

            {/* Status pie */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Status das Vagas</h3>
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, statusConfig[n]?.label || n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {statusData.map(s => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-white/60">{statusConfig[s.name]?.label || s.name}</span>
                        </div>
                        <span className="text-white font-medium">{s.value as number}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/30 text-sm">Sem dados</div>
              )}
            </div>
          </div>

          {/* Recent applications */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Candidaturas Recentes</h3>
              <Link href="/dashboard/applications" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {applications.length === 0 ? (
              <div className="p-10 text-center text-white/40 text-sm">
                Nenhuma candidatura ainda. <Link href="/dashboard/apply" className="text-brand-400 hover:underline">Iniciar automação →</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {applications.map((app: any) => {
                  const sc = statusConfig[app.status] ?? statusConfig.PENDING;
                  return (
                    <div key={app.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {app.company?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{app.jobTitle}</div>
                        <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                          <span>{app.company}</span>
                          {app.isRemote && <span className="badge-info text-[10px]">Remote</span>}
                          <span>{timeAgo(app.appliedAt || app.createdAt)}</span>
                        </div>
                      </div>
                      {app.aiScore && (
                        <div className="text-xs font-semibold text-brand-300 hidden sm:block">
                          Score: {Math.round(app.aiScore)}%
                        </div>
                      )}
                      <span className={`${sc.className} text-xs shrink-0`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
