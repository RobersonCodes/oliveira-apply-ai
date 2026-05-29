'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, TrendingUp, MessageSquare, CalendarCheck,
  ArrowUpRight, ArrowRight, Zap, Bot, Clock, Target,
  CheckCircle2, XCircle, Eye, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Mock Data ─────────────────────────────────────────────────────────────

const areaData = [
  { day: '1/12', aplicações: 4, respostas: 1, entrevistas: 0 },
  { day: '5/12', aplicações: 12, respostas: 3, entrevistas: 1 },
  { day: '10/12', aplicações: 28, respostas: 7, entrevistas: 2 },
  { day: '15/12', aplicações: 45, respostas: 14, entrevistas: 4 },
  { day: '20/12', aplicações: 67, respostas: 22, entrevistas: 6 },
  { day: '25/12', aplicações: 89, respostas: 31, entrevistas: 9 },
  { day: '30/12', aplicações: 124, respostas: 45, entrevistas: 13 },
];

const statusData = [
  { name: 'Aplicado', value: 124, color: '#6366f1' },
  { name: 'Visualizado', value: 45, color: '#8b5cf6' },
  { name: 'Entrevista', value: 13, color: '#10b981' },
  { name: 'Oferta', value: 3, color: '#f59e0b' },
  { name: 'Rejeitado', value: 28, color: '#ef4444' },
];

const recentApplications = [
  { id: 1, company: 'Nubank', role: 'Senior Frontend Engineer', status: 'INTERVIEW', appliedAt: '2h atrás', score: 94, remote: true, logo: 'N' },
  { id: 2, company: 'iFood', role: 'React Developer', status: 'VIEWED', appliedAt: '5h atrás', score: 87, remote: false, logo: 'i' },
  { id: 3, company: 'Mercado Livre', role: 'Full Stack Engineer', status: 'APPLIED', appliedAt: '8h atrás', score: 82, remote: true, logo: 'M' },
  { id: 4, company: 'PicPay', role: 'Tech Lead Frontend', status: 'APPLIED', appliedAt: '1d atrás', score: 78, remote: true, logo: 'P' },
  { id: 5, company: 'Loft', role: 'Software Engineer', status: 'REJECTED', appliedAt: '2d atrás', score: 61, remote: false, logo: 'L' },
  { id: 6, company: 'Creditas', role: 'Senior Developer', status: 'OFFER', appliedAt: '3d atrás', score: 96, remote: true, logo: 'C' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  APPLIED:   { label: 'Aplicado',   className: 'badge-info' },
  VIEWED:    { label: 'Visualizado', className: 'badge-purple' },
  INTERVIEW: { label: 'Entrevista', className: 'badge-success' },
  OFFER:     { label: 'Oferta',     className: 'badge-warning' },
  REJECTED:  { label: 'Rejeitado',  className: 'badge-danger' },
};

const stats = [
  { icon: Briefcase, label: 'Total Aplicações', value: '124', change: '+23', changeType: 'up', sub: 'este mês' },
  { icon: MessageSquare, label: 'Taxa de Resposta', value: '36%', change: '+8%', changeType: 'up', sub: 'vs. semana anterior' },
  { icon: CalendarCheck, label: 'Entrevistas', value: '13', change: '+4', changeType: 'up', sub: 'agendadas' },
  { icon: Target, label: 'Score Médio IA', value: '83', change: '+5', changeType: 'up', sub: 'match score' },
];

// ─── Custom Chart Tooltip ───────────────────────────────────────────────────

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

// ─── Component ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeAutomation] = useState(true);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bom dia, Oliveira 👋</h1>
          <p className="text-white/50 text-sm mt-1">Aqui está o resumo das suas candidaturas</p>
        </div>
        <Link href="/dashboard/apply" className="btn-primary gap-2 hidden sm:flex">
          <Zap size={15} />
          Nova automação
        </Link>
      </div>

      {/* Automation Status Banner */}
      {activeAutomation && (
        <div className="glass rounded-2xl p-4 border-brand-500/20 bg-brand-500/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
              <Bot size={16} className="text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Automação em execução</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              </div>
              <p className="text-white/40 text-xs mt-0.5">Buscando vagas Senior React Developer · 12/50 aplicações</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
              <Clock size={12} />
              <span>Iniciado às 09:23</span>
            </div>
            <Link href="/dashboard/apply" className="btn-secondary text-xs px-3 py-1.5">Ver detalhes</Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all duration-300">
                <stat.icon size={16} className="text-white/50 group-hover:text-brand-400 transition-colors" />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={10} />
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Progresso das Candidaturas</h3>
              <p className="text-xs text-white/40 mt-0.5">Últimos 30 dias</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[
                { color: '#6366f1', label: 'Aplicações' },
                { color: '#10b981', label: 'Respostas' },
                { color: '#f59e0b', label: 'Entrevistas' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-white/40">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="aplicações" stroke="#6366f1" strokeWidth={2} fill="url(#colorApps)" />
              <Area type="monotone" dataKey="respostas" stroke="#10b981" strokeWidth={2} fill="url(#colorResp)" />
              <Area type="monotone" dataKey="entrevistas" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Status das Vagas</h3>
          <p className="text-xs text-white/40 mb-6">Total: 213 vagas</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={statusData} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-white/60">{d.name}</span>
                </div>
                <span className="text-xs font-medium text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white">Candidaturas Recentes</h3>
            <p className="text-xs text-white/40 mt-0.5">Aplicações automáticas das últimas 48h</p>
          </div>
          <Link href="/dashboard/applications" className="btn-ghost text-xs gap-1.5">
            Ver todas <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {recentApplications.map((app) => {
            const { label, className } = statusConfig[app.status];
            return (
              <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 border border-white/[0.08] flex items-center justify-center text-sm font-bold text-brand-300 shrink-0">
                  {app.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white truncate">{app.role}</span>
                    {app.remote && (
                      <span className="text-[10px] text-white/40 bg-white/[0.05] px-1.5 py-0.5 rounded shrink-0">Remote</span>
                    )}
                  </div>
                  <span className="text-xs text-white/40">{app.company} · {app.appliedAt}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div className="text-xs text-white/50">Score:</div>
                  <div className={`text-xs font-semibold ${app.score >= 90 ? 'text-emerald-400' : app.score >= 75 ? 'text-brand-400' : 'text-amber-400'}`}>
                    {app.score}%
                  </div>
                </div>
                <span className={`${className} shrink-0`}>{label}</span>
                <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all ml-1 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
