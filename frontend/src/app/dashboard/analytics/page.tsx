'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Clock, Zap, Loader2, RefreshCw } from 'lucide-react';
import { analyticsApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#6366f1', VIEWED: '#8b5cf6', INTERVIEW: '#10b981',
  OFFER: '#f59e0b', REJECTED: '#ef4444', PENDING: '#6b7280',
};
const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Aplicado', VIEWED: 'Visualizado', INTERVIEW: 'Entrevista',
  OFFER: 'Oferta', REJECTED: 'Rejeitado', PENDING: 'Pendente',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/50 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60 capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [dashRes, chartsRes] = await Promise.allSettled([
        analyticsApi.dashboard(),
        analyticsApi.charts(),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.data);
      if (chartsRes.status === 'fulfilled') setCharts(chartsRes.value.data.data);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  const responseRate = dashboard?.responseRate ?? 0;
  const avgScore = dashboard?.avgAiScore ? Math.round(dashboard.avgAiScore) : 0;
  const total = dashboard?.totalApplications ?? 0;
  const interviews = dashboard?.interviews ?? 0;
  const offers = dashboard?.offers ?? 0;
  const conversionRate = total > 0 ? ((offers / total) * 100).toFixed(1) : '0.0';

  const kpis = [
    { label: 'Taxa de Resposta',   value: `${responseRate}%`,    trend: responseRate > 20 ? 'up' : 'down', icon: TrendingUp,  color: 'text-emerald-400' },
    { label: 'Score médio IA',     value: avgScore ? `${avgScore}%` : '—', trend: 'up',  icon: Target,     color: 'text-brand-400' },
    { label: 'Total candidaturas', value: total,                 trend: 'up',              icon: Zap,        color: 'text-purple-400' },
    { label: 'Taxa de conversão',  value: `${conversionRate}%`,  trend: offers > 0 ? 'up' : 'down', icon: Award, color: 'text-amber-400' },
  ];

  // Status breakdown
  const statusBreakdown = dashboard?.statusBreakdown ?? {};
  const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({
    name, value, color: STATUS_COLORS[name] ?? '#6b7280', label: STATUS_LABELS[name] ?? name,
  }));

  // Trend data
  const trendData = charts?.trend ?? charts?.applications ?? [];

  // Platform data
  const platformData = charts?.platforms ?? [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Métricas detalhadas das suas candidaturas</p>
        </div>
        <button onClick={load} className="btn-ghost p-2"><RefreshCw size={15} /></button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <k.icon size={16} className={k.color} />
              <span className={`text-xs ${k.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {k.trend === 'up' ? '↑' : '↓'}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{k.value}</div>
            <div className="text-xs text-white/50">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Evolução semanal</h3>
          <ResponsiveContainer width="100%" height={220}>
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
              <Area type="monotone" dataKey="respostas" stroke="#10b981" fill="none" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        {statusData.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Status das candidaturas</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, STATUS_LABELS[n] ?? n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-white/60">{s.label}</span>
                  </div>
                  <span className="text-white font-medium">{s.value as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform breakdown */}
        {platformData.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Por plataforma</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <Zap size={40} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/50 text-sm">Nenhuma candidatura ainda. Inicie uma automação para ver seus analytics.</p>
        </div>
      )}
    </div>
  );
}
