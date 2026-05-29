'use client';
import { useState } from 'react';
import { User, Bell, Shield, CreditCard, Linkedin, Key, Save, Loader2, CheckCircle2 } from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'billing', label: 'Plano & Cobrança', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-white/50 text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 shrink-0">
          <div className="glass rounded-2xl p-2 space-y-0.5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === t.id
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <t.icon size={15} className={activeTab === t.id ? 'text-brand-400' : 'text-white/40'} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'profile' && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Informações pessoais</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">Nome completo</label><input className="input-field" defaultValue="Oliveira Silva" /></div>
                <div><label className="label">Email</label><input type="email" className="input-field" defaultValue="oliveira@email.com" /></div>
                <div><label className="label">Telefone</label><input className="input-field" defaultValue="+55 11 9 9999-9999" /></div>
                <div><label className="label">Localização</label><input className="input-field" defaultValue="São Paulo, SP" /></div>
                <div><label className="label">LinkedIn</label><input className="input-field" defaultValue="linkedin.com/in/oliveira" /></div>
                <div><label className="label">GitHub</label><input className="input-field" defaultValue="github.com/oliveira" /></div>
              </div>
              <div><label className="label">Bio</label><textarea rows={3} className="input-field resize-none" defaultValue="Senior Frontend Engineer apaixonado por React, performance e bons produtos." /></div>
              <div>
                <label className="label">Habilidades principais</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['React', 'TypeScript', 'Next.js', 'Node.js', 'Docker', 'AWS'].map(s => (
                    <span key={s} className="badge-info text-xs cursor-pointer hover:opacity-70">{s} ×</span>
                  ))}
                  <button className="badge-default text-xs">+ Adicionar</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Conta LinkedIn</h3>
              <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white">in</div>
                <div>
                  <div className="text-sm font-medium text-white">oliveira@email.com</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Conectado e ativo
                  </div>
                </div>
                <button className="ml-auto btn-danger text-xs px-3 py-1.5">Desconectar</button>
              </div>
              <div><label className="label">Email LinkedIn</label><input type="email" className="input-field" defaultValue="oliveira@email.com" /></div>
              <div><label className="label">Senha LinkedIn</label><input type="password" className="input-field" defaultValue="••••••••••" /></div>
              <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-400/80">
                ⚠️ Suas credenciais são criptografadas com AES-256. Nunca armazenamos em texto simples.
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Segurança da conta</h3>
              <div><label className="label">Senha atual</label><input type="password" className="input-field" placeholder="••••••••" /></div>
              <div><label className="label">Nova senha</label><input type="password" className="input-field" placeholder="••••••••" /></div>
              <div><label className="label">Confirmar nova senha</label><input type="password" className="input-field" placeholder="••••••••" /></div>
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">Autenticação de 2 fatores</div>
                    <div className="text-xs text-white/40 mt-0.5">Adicione uma camada extra de segurança</div>
                  </div>
                  <button className="btn-secondary text-xs px-3 py-1.5">Ativar 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 border-brand-500/20 bg-brand-500/[0.03]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Plano Pro</div>
                    <div className="text-xs text-white/40">Renova em 15 de Fevereiro de 2025</div>
                  </div>
                  <span className="badge-success">Ativo</span>
                </div>
                <div className="space-y-2 text-sm text-white/60">
                  {['500 candidaturas/mês', 'IA GPT-4o', 'Multi-plataforma', 'Suporte prioritário'].map(f => (
                    <div key={f} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-brand-400" />{f}</div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">R$149<span className="text-sm font-normal text-white/40">/mês</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs px-3 py-1.5">Alterar plano</button>
                    <button className="btn-danger text-xs px-3 py-1.5">Cancelar</button>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Uso este mês</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-white/50 mb-1.5">
                      <span>Candidaturas</span><span className="text-white">124 / 500</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full"><div className="h-full bg-brand-500 rounded-full" style={{ width: '24.8%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Preferências de notificação</h3>
              {[
                { label: 'Candidatura aplicada', sub: 'Quando a automação aplica para uma vaga', def: true },
                { label: 'Resposta recebida', sub: 'Quando uma empresa visualiza seu currículo', def: true },
                { label: 'Entrevista agendada', sub: 'Quando você recebe um convite para entrevista', def: true },
                { label: 'Automação concluída', sub: 'Quando um ciclo de automação termina', def: true },
                { label: 'Resumo semanal', sub: 'Relatório semanal das suas candidaturas', def: false },
              ].map(n => {
                const [on, setOn] = useState(n.def);
                return (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div>
                      <div className="text-sm text-white">{n.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{n.sub}</div>
                    </div>
                    <button onClick={() => setOn(!on)} className={`w-10 rounded-full transition-all duration-300 relative shrink-0 ${on ? 'bg-brand-500' : 'bg-white/10'}`} style={{ height: 22 }}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save btn */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
              {saved ? <><CheckCircle2 size={14} /> Salvo!</> : saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salvar alterações</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
