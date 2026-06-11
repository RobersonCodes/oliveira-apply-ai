'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',      color: '#0A66C2', short: 'in', desc: 'Candidaturas automáticas com Easy Apply',          url: 'https://linkedin.com/signup' },
  { id: 'indeed',    label: 'Indeed',         color: '#003A9B', short: 'IN', desc: 'Maior buscador de empregos do mundo',               url: 'https://secure.indeed.com/account/register' },
  { id: 'catho',     label: 'Catho',          color: '#E8000D', short: 'CA', desc: 'Maior plataforma de vagas do Brasil',               url: 'https://www.catho.com.br/cadastro' },
  { id: 'vagas',     label: 'Vagas.com.br',   color: '#FF6B00', short: 'VG', desc: 'Vagas em todo o Brasil',                            url: 'https://www.vagas.com.br/cadastro' },
  { id: 'geekhunter',label: 'GeekHunter',     color: '#6B21A8', short: 'GH', desc: 'Especializado em vagas de tecnologia',              url: 'https://www.geekhunter.com.br/cadastro' },
  { id: 'infojobs',  label: 'InfoJobs',       color: '#00A8E0', short: 'IJ', desc: 'Vagas nacionais e internacionais',                  url: 'https://www.infojobs.com.br/cadastro.aspx' },
  { id: 'glassdoor', label: 'Glassdoor',      color: '#0CAA41', short: 'GD', desc: 'Vagas com avaliações de empresas',                  url: 'https://www.glassdoor.com.br/member/joinNow' },
  { id: 'gupy',      label: 'Gupy',           color: '#4F46E5', short: 'GU', desc: 'Plataforma de recrutamento de grandes empresas',    url: 'https://portal.gupy.io/signup' },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/connections')
      .then(r => setConnections(r.data?.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (platformId: string) => {
    setSaving(true);
    try {
      await api.post('/users/connections', { platform: platformId, email, password });
      setConnections(prev => ({ ...prev, [platformId]: { email, connected: true } }));
      toast.success('Conta conectada com sucesso!');
      setModal(null);
      setEmail('');
      setPassword('');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await api.delete(`/users/connections/${platformId}`);
      setConnections(prev => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
      toast.success('Conta desconectada.');
    } catch {
      toast.error('Erro ao desconectar.');
    }
  };

  const openModal = (platformId: string) => {
    setEmail(connections[platformId]?.email ?? '');
    setPassword('');
    setShowPass(false);
    setModal(platformId);
  };

  const activePlatform = PLATFORMS.find(p => p.id === modal);
  const connectedCount = Object.keys(connections).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Plataformas conectadas</h1>
        <p className="text-white/50 text-sm mt-1">
          Conecte suas contas para candidaturas automáticas — {connectedCount} de {PLATFORMS.length} conectadas
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/[0.06] border border-brand-500/20">
        <Shield size={16} className="text-brand-400 mt-0.5 shrink-0" />
        <p className="text-xs text-white/60">
          Suas credenciais são criptografadas com <strong className="text-white">AES-256</strong> e usadas exclusivamente para automação de candidaturas em seu nome. Nunca são compartilhadas.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 size={28} className="text-brand-400 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PLATFORMS.map(platform => {
            const conn = connections[platform.id];
            const isConnected = !!conn;

            return (
              <div key={platform.id} className={`glass rounded-2xl p-5 transition-all ${isConnected ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: platform.color }}>
                      {platform.short}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{platform.label}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isConnected
                          ? <><CheckCircle2 size={10} className="text-emerald-400" /><span className="text-[10px] text-emerald-400">Conectado</span></>
                          : <><XCircle size={10} className="text-white/30" /><span className="text-[10px] text-white/30">Não conectado</span></>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/40 mb-4 min-h-[32px]">{platform.desc}</p>

                {isConnected ? (
                  <div className="space-y-2">
                    <div className="text-xs text-white/50 truncate">{conn.email}</div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(platform.id)} className="btn-ghost text-xs px-3 py-1.5 flex-1">Editar</button>
                      <button onClick={() => handleDisconnect(platform.id)} className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Remover</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => openModal(platform.id)} className="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">Conectar</button>
                    <a href={platform.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5" title="Criar conta">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: activePlatform.color }}>
                {activePlatform.short}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Conectar {activePlatform.label}</h3>
                <p className="text-xs text-white/40">Credenciais criptografadas AES-256</p>
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" autoComplete="email" />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => handleConnect(modal)}
                disabled={saving || !email || !password}
                className="btn-primary flex-1 gap-2 justify-center"
              >
                {saving ? <><Loader2 size={13} className="animate-spin" /> Salvando...</> : 'Conectar'}
              </button>
            </div>

            <p className="text-[10px] text-white/25 text-center">
              Não tem conta?{' '}
              <a href={activePlatform.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
                Criar conta grátis ↗
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
