'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Star, Crown, Building2, ArrowLeft } from 'lucide-react';
import { billingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 0,
    description: 'Para experimentar a plataforma',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      '10 candidaturas/mês',
      '1 automação simultânea',
      'Dashboard básico',
      'Adaptação de currículo (IA)',
      'Suporte por email',
    ],
    cta: 'Começar grátis',
    popular: false,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 4900,
    description: 'Para quem está começando a busca',
    icon: Star,
    color: 'from-brand-500 to-brand-600',
    features: [
      '100 candidaturas/mês',
      '2 automações simultâneas',
      'Dashboard completo',
      'IA ilimitada',
      'Cover letter personalizada',
      'Anti-detecção avançado',
      'Suporte prioritário',
    ],
    cta: 'Assinar Starter',
    popular: false,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 14900,
    description: 'Para maximizar suas chances',
    icon: Crown,
    color: 'from-purple-500 to-brand-600',
    features: [
      '500 candidaturas/mês',
      '5 automações simultâneas',
      'Todas as plataformas',
      'IA GPT-4 otimizada',
      'Análise de fit profunda',
      'Preparação para entrevistas',
      'Analytics avançado',
      'Trial grátis de 7 dias',
      'Suporte via chat',
    ],
    cta: 'Começar Trial',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 49900,
    description: 'Para times e poder total',
    icon: Building2,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Candidaturas ilimitadas',
      '20 automações simultâneas',
      'Todas as plataformas',
      'IA personalizada',
      'Suporte dedicado 24/7',
      'API access',
      'SLA garantido',
      'Onboarding personalizado',
    ],
    cta: 'Falar com vendas',
    popular: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  async function handleSubscribe(planId: string) {
    if (planId === 'FREE') {
      window.location.href = '/auth/register';
      return;
    }
    if (planId === 'ENTERPRISE') {
      window.location.href = 'mailto:enterprise@oliveira-apply.ai';
      return;
    }
    if (!isAuthenticated) {
      window.location.href = '/auth/register';
      return;
    }

    setLoading(planId);
    try {
      const { data } = await billingApi.createCheckout(planId);
      window.location.href = data.data.url;
    } catch {
      toast.error('Erro ao redirecionar para checkout');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary dot-bg">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-12 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
              <Zap className="w-3 h-3" />
              Preços transparentes
            </span>
            <h1 className="text-5xl font-bold text-text-primary mb-4">
              Escolha seu <span className="gradient-text-brand">plano ideal</span>
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Invista em sua carreira. Nossos planos pagam por si mesmos com a primeira entrevista agendada.
            </p>
          </motion.div>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'text-text-primary' : 'text-text-muted'}`}>Mensal</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-brand-600' : 'bg-surface-tertiary'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-text-primary' : 'text-text-muted'}`}>
              Anual <span className="text-green-400 font-semibold">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = annual ? Math.floor(plan.price * 0.8) : plan.price;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass rounded-2xl p-6 flex flex-col ${
                  plan.popular ? 'border-brand-500/50 ring-2 ring-brand-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
                    ✨ Mais popular
                  </div>
                )}

                <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.color} w-fit mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="text-sm text-text-muted mt-1 mb-4">{plan.description}</p>

                <div className="mb-6">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-text-primary">Grátis</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-text-primary">
                        R${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-text-muted">/mês</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {loading === plan.id ? 'Aguarde...' : plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Dúvidas frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left max-w-4xl mx-auto">
            {[
              { q: 'Posso cancelar quando quiser?', a: 'Sim! Sem fidelidade, sem taxa de cancelamento. Cancele quando quiser direto nas configurações.' },
              { q: 'Minha conta do LinkedIn fica segura?', a: 'Suas credenciais são criptografadas com AES-256-GCM e nunca armazenadas em texto simples.' },
              { q: 'O que acontece se eu atingir o limite?', a: 'Você recebe uma notificação e pode fazer upgrade a qualquer momento para continuar.' },
              { q: 'Suportam outras plataformas além do LinkedIn?', a: 'Sim! Indeed, Glassdoor, Gupy e Catho estão disponíveis nos planos Starter, Pro e Enterprise.' },
            ].map(({ q, a }) => (
              <div key={q} className="glass rounded-xl p-6">
                <h4 className="text-text-primary font-semibold mb-2">{q}</h4>
                <p className="text-text-muted text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
