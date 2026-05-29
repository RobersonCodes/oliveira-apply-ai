'use client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Clock, Zap } from 'lucide-react';

const weeklyData = [
  { week: 'Sem 1', aplicações: 18, respostas: 5, entrevistas: 1, ofertas: 0 },
  { week: 'Sem 2', aplicações: 32, respostas: 11, entrevistas: 3, ofertas: 0 },
  { week: 'Sem 3', aplicações: 41, respostas: 15, entrevistas: 5, ofertas: 1 },
  { week: 'Sem 4', aplicações: 55, respostas: 22, entrevistas: 8, ofertas: 2 },
];

const platformData = [
  { name: 'LinkedIn', value: 68, color: '#0077b5' },
  { name: 'Glassdoor', value: 15, color: '#0caa41' },
  { name: 'Indeed', value: 12, color: '#2164f3' },
  { name: 'Outros', value: 5, color: '#6b7280' },
];

const companySizeData = [
  { size: 'Startup', aplicações: 45, respostas: 18 },
  { size: 'PME', aplicações: 38, respostas: 12 },
  { size: 'Corp.', aplicações: 29, respostas: 8 },
  { size: 'Enterprise', aplicações: 12, respostas: 7 },
];

const topSkills = [
  { skill: 'React', vagas: 89, match: 94 },
  { skill: 'TypeScript', vagas: 76, match: 91 },
  { skill: 'Node.js', vagas: 54, match: 87 },
  { skill: 'Next.js', vagas: 48, match: 95 },
  { skill: 'Docker', vagas: 43, match: 82 },
  { skill: 'AWS', vagas: 38, match: 74 },
];

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
  const kpis = [
    { label: 'Taxa de Resposta', value: '36%', sub: '+8% vs mês anterior', trend: 'up', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Score médio IA', value: '83%', sub: 'Match com vagas aplicadas', trend: 'up', icon: Target, color: 'text-brand-400' },
    { label: 'Tempo p/ resposta', value: '3.2d', sub: 'Média do mercado: 5.8d', trend: 'up', icon: Clock, color: 'text-purple-400' },
    { label: 'Taxa de conversão', value: '1.6%', sub: 'Aplicação → Oferta', trend: 'down', icon: Award, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/50 text-sm mt-1">Métricas detalhadas das suas candidaturas</p>
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
            <div className="text-[10px] text-white/30 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly trend */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Funil de candidaturas por semana</h3>
        <p className="text-xs text-white/40 mb-6">Aplicações → Respostas → Entrevistas → Ofertas</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="aplicações" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="respostas" fill="#8b5cf6" radius={[4,4,0,0]} />
            <Bar dataKey="entrevistas" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="ofertas" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Platform pie */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Plataformas</h3>
          <p className="text-xs text-white/40 mb-4">Distribuição de candidaturas</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={platformData} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {platformData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {platformData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-white/60">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company size */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Por porte da empresa</h3>
          <p className="text-xs text-white/40 mb-4">Aplicações vs respostas</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={companySizeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis dataKey="size" type="category" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="aplicações" fill="#6366f1" radius={[0,4,4,0]} />
              <Bar dataKey="respostas" fill="#10b981" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top skills */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Habilidades em demanda</h3>
          <p className="text-xs text-white/40 mb-4">Suas skills vs mercado</p>
          <div className="space-y-3">
            {topSkills.map(s => (
              <div key={s.skill}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/70 font-medium">{s.skill}</span>
                  <span className="text-brand-400">{s.match}% match</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all"
                    style={{ width: `${s.match}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
