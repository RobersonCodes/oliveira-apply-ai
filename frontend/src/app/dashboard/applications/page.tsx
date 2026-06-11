'use client';
import { useState, useEffect } from 'react';
import { Search, ExternalLink, Loader2, RefreshCw, CalendarCheck, Eye, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { applicationApi } from '@/lib/api';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; className: string }> = {
  APPLIED:   { label: 'Aplicado',    className: 'badge-info' },
  VIEWED:    { label: 'Visualizado', className: 'badge-purple' },
  INTERVIEW: { label: 'Entrevista',  className: 'badge-success' },
  OFFER:     { label: 'Oferta 🎉',  className: 'badge-warning' },
  REJECTED:  { label: 'Rejeitado',  className: 'badge-danger' },
  PENDING:   { label: 'Pendente',   className: 'badge-default' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await applicationApi.list(params);
      setApplications(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch { setApplications([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter, page]);
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidaturas</h1>
          <p className="text-white/50 text-sm mt-1">{total} candidaturas no total</p>
        </div>
        <button onClick={load} className="btn-ghost p-2">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" placeholder="Buscar empresa ou cargo..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'APPLIED', 'VIEWED', 'INTERVIEW', 'OFFER', 'REJECTED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300' : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'}`}>
              {s === 'ALL' ? 'Todos' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-white/30 text-sm">Nenhuma candidatura encontrada.</div>
            <Link href="/dashboard/apply" className="btn-primary mt-4 gap-2 inline-flex text-sm">
              Iniciar automação
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Empresa / Cargo', 'Plataforma', 'Score IA', 'Status', 'Aplicado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {applications.map((app: any) => {
                  const sc = statusConfig[app.status] ?? statusConfig.PENDING;
                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {app.company?.[0] ?? '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{app.jobTitle}</div>
                            <div className="text-xs text-white/40">{app.company} {app.location ? `· ${app.location}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 capitalize">{app.platform}</td>
                      <td className="px-4 py-3">
                        {app.aiScore ? (
                          <span className="text-xs font-semibold text-brand-300">{Math.round(app.aiScore)}%</span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`${sc.className} text-xs`}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-xs text-white/40">{timeAgo(app.appliedAt || app.createdAt)}</td>
                      <td className="px-4 py-3">
                        {app.jobUrl && (
                          <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>Mostrando {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} de {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-1.5 disabled:opacity-30">Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-ghost px-3 py-1.5 disabled:opacity-30">Próxima</button>
          </div>
        </div>
      )}
    </div>
  );
}
