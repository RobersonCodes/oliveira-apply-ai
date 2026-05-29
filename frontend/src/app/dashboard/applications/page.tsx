'use client';
import { useState } from 'react';
import {
  Search, Filter, ArrowUpDown, ExternalLink, Bot,
  Building2, MapPin, Clock, ChevronDown, Briefcase,
} from 'lucide-react';

const applications = [
  { id: 1, company: 'Nubank', role: 'Senior Frontend Engineer', location: 'São Paulo (Remote)', status: 'INTERVIEW', appliedAt: '2h atrás', score: 94, platform: 'LinkedIn', salary: 'R$18k–25k' },
  { id: 2, company: 'iFood', role: 'React Developer', location: 'São Paulo', status: 'VIEWED', appliedAt: '5h atrás', score: 87, platform: 'LinkedIn', salary: 'R$12k–18k' },
  { id: 3, company: 'Mercado Livre', role: 'Full Stack Engineer', location: 'Remote', status: 'APPLIED', appliedAt: '8h atrás', score: 82, platform: 'LinkedIn', salary: 'R$15k–22k' },
  { id: 4, company: 'PicPay', role: 'Tech Lead Frontend', location: 'Remote', status: 'APPLIED', appliedAt: '1d atrás', score: 78, platform: 'Glassdoor', salary: 'R$22k–30k' },
  { id: 5, company: 'Loft', role: 'Software Engineer', location: 'São Paulo', status: 'REJECTED', appliedAt: '2d atrás', score: 61, platform: 'LinkedIn', salary: 'R$10k–15k' },
  { id: 6, company: 'Creditas', role: 'Senior Developer', location: 'Remote', status: 'OFFER', appliedAt: '3d atrás', score: 96, platform: 'LinkedIn', salary: 'R$20k–28k' },
  { id: 7, company: 'Gympass', role: 'Frontend Engineer', location: 'Remote', status: 'APPLIED', appliedAt: '3d atrás', score: 85, platform: 'LinkedIn', salary: 'R$14k–20k' },
  { id: 8, company: 'QuintoAndar', role: 'React Specialist', location: 'São Paulo', status: 'VIEWED', appliedAt: '4d atrás', score: 89, platform: 'Indeed', salary: 'R$16k–22k' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  APPLIED:   { label: 'Aplicado',    className: 'badge-info' },
  VIEWED:    { label: 'Visualizado', className: 'badge-purple' },
  INTERVIEW: { label: 'Entrevista',  className: 'badge-success' },
  OFFER:     { label: 'Oferta 🎉',   className: 'badge-warning' },
  REJECTED:  { label: 'Rejeitado',   className: 'badge-danger' },
};

export default function ApplicationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = applications.filter(a =>
    (statusFilter === 'ALL' || a.status === statusFilter) &&
    (a.company.toLowerCase().includes(search.toLowerCase()) ||
     a.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidaturas</h1>
          <p className="text-white/50 text-sm mt-1">{applications.length} candidaturas no total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Buscar empresa ou cargo..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'APPLIED', 'VIEWED', 'INTERVIEW', 'OFFER', 'REJECTED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'Todos' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Empresa / Cargo', 'Local', 'Plataforma', 'Score IA', 'Salário', 'Status', 'Aplicado'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-white/30 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(app => {
                const { label, className } = statusConfig[app.status];
                return (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                          {app.company[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{app.role}</div>
                          <div className="text-xs text-white/40">{app.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <MapPin size={10} className="shrink-0" />
                        {app.location}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge-default text-[10px]">{app.platform}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Bot size={10} className="text-brand-400" />
                        <span className={`text-xs font-semibold ${app.score >= 90 ? 'text-emerald-400' : app.score >= 75 ? 'text-brand-400' : 'text-amber-400'}`}>
                          {app.score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-white/50">{app.salary}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={className}>{label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <Clock size={10} />
                        {app.appliedAt}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma candidatura encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
