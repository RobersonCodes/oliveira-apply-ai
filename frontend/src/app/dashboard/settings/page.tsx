'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Link2, Bell, CreditCard, Shield, Save, Loader2, CheckCircle2,
  ExternalLink, Crown, Zap, Star, Building2, ArrowUpRight, Unlink,
} from 'lucide-react';
import { billingApi, userApi, authApi } from '@/lib/api';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oliveira-apply-ai-production.up.railway.app';

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'linkedin', label: 'LinkedIn', icon: Link2 },
  { id: 'billing', label: 'Plano & Cobrança', icon: CreditCard },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
];

const PLAN_INFO: Record<string, { label: string; color: string; icon: any; features: string[] }> = {
  FREE: { label: 'Gratuito', color: 'text-white/40', icon: Zap, features: ['10 candidaturas/mês', '1 automação simultânea', 'Dashboard básico'] },
  STARTER: { label: 'Starter', color: 'text-brand-400', icon: Star, features: ['100 candidaturas/mês', '2 automações simultâneas', 'IA ilimitada', 'Suporte prioritário'] },
  PRO: { label: 'Pro', color: 'text-purple-400', icon: Crown, features: ['500 candidaturas/mês', '5 automações simultâneas', 'Todos os módulos IA', 'GPT-4 otimizado', 'Trial 7 dias grátis'] },
  ENTERPRISE: { label: 'Enterprise', color: 'text-yellow-400', icon: Building2, features: ['Candidaturas ilimitadas', '20 automações simultâneas', 'Suporte dedicado 24/7', 'API access', 'SLA garantido'] },
};

const UPGRADE_PLANS = [
  { id: 'STARTER', name: 'Starter', price: 'R$47/mês', cta: 'Assinar Starter' },
  { id: 'PRO', name: 'Pro', price: 'R$97/mês', cta: 'Começar Trial Grátis', popular: true },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 'R$197/mês', cta: 'Falar com vendas' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState<any>(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'billing') loadSubscription();
    if (activeTab === 'linkedin') loadLinkedinStatus();
  }, [activeTab]);

  async function loadLinkedinStatus() {
    setLinkedinLoading(true);
    try {
      const { data } = await authApi.linkedinStatus();
      setLinkedinStatus(data.data);
    } catch { } finally {
      setLinkedinLoading(false);
    }
  }

  async function handleLinkedinConnect() {
    window.location.href = `${BACKEND_URL}/api/auth/linkedin`;
  }

  async function handleLinkedinDisconnect() {
    try {
      await authApi.linkedinDisconnect();
      setLinkedinStatus({ connected: false });
      toast.success('LinkedIn desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    }
  }

  async function handleImportProfile() {
    setLinkedinLoading(true);
    try {
      const { data } = await authApi.linkedinImportProfile();
      toast.success('Perfil importado com sucesso!');
    } catch {
      toast.error('Erro ao importar perfil');
    } finally {
      setLinkedinLoading(false);
    }
  }

  async function loadSubscription() {
    setSubLoading(true);
    try {
      const { data } = await billingApi.getSubscription();
      setSubscription(data.data);
    } catch {
      // sem assinatura ainda — ok
    } finally {
      setSubLoading(false);
    }
  }

  async function handleCheckout(planId: string) {
    if (planId === 'ENTERPRISE') {
      window.location.href = 'mailto:enterprise@oliveira-apply.ai';
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { data } = await billingApi.createCheckout(planId);
      window.location.href = data.data.url;
    } catch {
      toast.error('Erro ao abrir checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { data } = await billingApi.createPortal();
      window.open(data.data.url, '_blank');
    } catch {
      toast.error('Erro ao abrir portal de cobrança.');
    } finally {
      setPortalLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const plan = subscription?.plan ?? 'FREE';
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.FREE;
  const PlanIcon = planInfo.icon;

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

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
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Conta LinkedIn</h3>
              {linkedinLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-brand-400" />
                </div>
              ) : linkedinStatus?.connected ? (
                <>
                  <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center gap-3">
                    {linkedinStatus.profile?.picture ? (
                      <img src={linkedinStatus.profile.picture} className="w-10 h-10 rounded-lg object-cover" alt="avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#0077B5] flex items-center justify-center text-sm font-bold text-white">in</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{linkedinStatus.profile?.name || 'Conectado'}</div>
                      <div className="text-xs text-white/40 truncate">{linkedinStatus.profile?.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Conectado e ativo
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleImportProfile} disabled={linkedinLoading} className="btn-primary gap-2 flex-1 justify-center">
                      {linkedinLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      Importar perfil
                    </button>
                    <button onClick={handleLinkedinDisconnect} className="btn-ghost gap-2 text-red-400 hover:text-red-300 border-red-500/20">
                      <Unlink size={14} /> Desconectar
                    </button>
                  </div>
                  <p className="text-xs text-white/30">O perfil do LinkedIn será usado para preencher seu currículo automaticamente.</p>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white/30">in</div>
                    <div>
                      <div className="text-sm text-white/50">LinkedIn não conectado</div>
                      <div className="text-xs text-white/30 mt-0.5">Conecte para importar seu perfil automaticamente</div>
                    </div>
                  </div>
                  <button onClick={handleLinkedinConnect} className="w-full btn-secondary gap-2.5 justify-center py-3 hover:bg-[#0077B5]/20 hover:border-[#0077B5]/40 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    Conectar LinkedIn
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              {subLoading ? (
                <div className="glass rounded-2xl p-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Plano atual */}
                  <div className="glass rounded-2xl p-6 border-brand-500/20 bg-brand-500/[0.03]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                          <PlanIcon size={18} className={planInfo.color} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Plano {planInfo.label}</div>
                          {subscription?.currentPeriodEnd && (
                            <div className="text-xs text-white/40 mt-0.5">
                              {subscription.cancelAtPeriodEnd ? 'Cancela em' : 'Renova em'} {formatDate(subscription.currentPeriodEnd)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`badge-success text-xs ${subscription?.status === 'ACTIVE' || plan !== 'FREE' ? '' : 'badge-default'}`}>
                        {subscription?.status === 'ACTIVE' ? 'Ativo' : plan === 'FREE' ? 'Gratuito' : 'Inativo'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-white/60 mb-4">
                      {planInfo.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-brand-400" />{f}
                        </div>
                      ))}
                    </div>

                    {plan !== 'FREE' && (
                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
                        <button
                          onClick={handlePortal}
                          disabled={portalLoading}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                        >
                          {portalLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                          Gerenciar assinatura
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Uso este mês */}
                  {subscription && (
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white mb-4">Uso este mês</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs text-white/50 mb-1.5">
                            <span>Candidaturas</span>
                            <span className="text-white">{subscription.applicationsUsed ?? 0} / {subscription.applicationsLimit ?? 10}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{ width: `${Math.min(((subscription.applicationsUsed ?? 0) / (subscription.applicationsLimit ?? 10)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upgrade / planos disponíveis */}
                  {plan === 'FREE' && (
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white mb-1">Faça upgrade para automação completa</h3>
                      <p className="text-xs text-white/40 mb-4">Desbloqueie todos os módulos de IA e candidaturas ilimitadas</p>
                      <div className="space-y-3">
                        {UPGRADE_PLANS.map(p => (
                          <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.popular ? 'border-brand-500/30 bg-brand-500/[0.06]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{p.name}</span>
                                {p.popular && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">Mais popular</span>}
                              </div>
                              <div className="text-xs text-white/40 mt-0.5">{p.price}</div>
                            </div>
                            <button
                              onClick={() => handleCheckout(p.id)}
                              disabled={checkoutLoading === p.id}
                              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all ${p.popular ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              {checkoutLoading === p.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                              {p.cta}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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

          {activeTab === 'security' && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Alterar senha</h3>
              <div className="space-y-3">
                <div><label className="label">Senha atual</label><input type="password" className="input-field" placeholder="••••••••" /></div>
                <div><label className="label">Nova senha</label><input type="password" className="input-field" placeholder="••••••••" /></div>
                <div><label className="label">Confirmar nova senha</label><input type="password" className="input-field" placeholder="••••••••" /></div>
              </div>
            </div>
          )}

          {activeTab !== 'billing' && (
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
                {saved ? <><CheckCircle2 size={14} />Salvo!</> : saving ? <><Loader2 size={14} className="animate-spin" />Salvando...</> : <><Save size={14} />Salvar alterações</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}