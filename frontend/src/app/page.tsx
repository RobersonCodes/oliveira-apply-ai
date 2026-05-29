import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Bot, CheckCircle2, Star } from 'lucide-react';

export default function HomePage() {
  const features = [
    { icon: Bot, title: 'Auto Apply com IA', desc: 'Candidaturas automáticas no LinkedIn com simulação humana e anti-detecção avançada.' },
    { icon: Zap, title: 'Currículo Adaptativo', desc: 'IA reescreve seu currículo em tempo real para cada vaga, maximizando o ATS score.' },
    { icon: Shield, title: 'Sistema Anti-Bloqueio', desc: 'Delays humanizados, fingerprint management e randomização de comportamento.' },
    { icon: BarChart3, title: 'Analytics em Tempo Real', desc: 'Dashboard com métricas completas: taxa de resposta, entrevistas e ofertas.' },
  ];

  const stats = [
    { value: '10x', label: 'mais candidaturas' },
    { value: '68%', label: 'taxa de resposta' },
    { value: '3.2x', label: 'mais entrevistas' },
    { value: '< 5min', label: 'setup inicial' },
  ];

  const plans = [
    {
      name: 'Starter', price: 'R$49', period: '/mês',
      features: ['100 candidaturas/mês', 'Auto Apply LinkedIn', 'Currículo adaptativo', 'Analytics básico', 'Suporte por email'],
      cta: 'Começar grátis', highlight: false,
    },
    {
      name: 'Pro', price: 'R$149', period: '/mês',
      features: ['500 candidaturas/mês', 'Multi-plataforma', 'IA GPT-4o', 'Cover letter personalizada', 'Analytics avançado', 'Anti-detecção premium', 'Suporte prioritário'],
      cta: '7 dias grátis', highlight: true,
    },
    {
      name: 'Enterprise', price: 'R$499', period: '/mês',
      features: ['Ilimitado', 'API dedicada', 'IA personalizada', 'Gerente de conta', 'SLA 99.9%', 'Suporte 24/7'],
      cta: 'Falar com vendas', highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080812] text-white overflow-hidden">
      {/* Grid BG */}
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold">OA</div>
          <span className="font-semibold text-white">Oliveira Apply AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm">Entrar</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Começar grátis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          IA aplicando para você agora
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          <span className="gradient-text">Automatize suas</span>
          <br />
          <span className="gradient-text-brand">candidaturas</span>
          <br />
          <span className="gradient-text">com IA</span>
        </h1>
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Plataforma SaaS que aplica automaticamente para vagas no LinkedIn, adapta seu currículo com GPT-4 e multiplica suas chances de conseguir entrevistas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register" className="btn-primary px-8 py-3.5 text-base gap-2.5">
            Começar grátis — 7 dias <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="btn-secondary px-8 py-3.5 text-base">
            Ver demo ao vivo
          </Link>
        </div>
        <p className="text-white/30 text-sm mt-5">Sem cartão de crédito · Cancele quando quiser</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-20 rounded-2xl overflow-hidden border border-white/[0.06]">
          {stats.map((s) => (
            <div key={s.value} className="bg-white/[0.02] px-6 py-6 text-center hover:bg-white/[0.04] transition-colors">
              <div className="text-3xl font-bold gradient-text-brand mb-1">{s.value}</div>
              <div className="text-white/50 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Tudo que você precisa para conseguir emprego</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Tecnologia de ponta combinada com automação inteligente para maximizar suas chances.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-hover rounded-2xl p-6 group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <f.icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Simples e transparente</h2>
          <p className="text-white/50 text-lg">Escolha o plano ideal. Mude quando quiser.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-8 flex flex-col relative ${
              p.highlight
                ? 'bg-brand-500/10 border-2 border-brand-500/40 shadow-[0_0_60px_rgba(99,102,241,0.2)]'
                : 'glass'
            }`}>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                  Mais popular
                </div>
              )}
              <div className="mb-8">
                <h3 className="font-semibold text-white mb-4">{p.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
                  <span className="text-white/50 text-sm mb-1">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                    <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className={p.highlight ? 'btn-primary text-center' : 'btn-secondary text-center'}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 text-center max-w-3xl mx-auto">
        <div className="glass rounded-3xl p-12">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">Pronto para multiplicar suas entrevistas?</h2>
          <p className="text-white/50 mb-8">Junte-se a mais de 2.400 profissionais que já automatizaram suas candidaturas.</p>
          <Link href="/auth/register" className="btn-primary px-10 py-4 text-base">
            Começar agora — grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-8 text-center text-white/30 text-sm">
        <p>© 2025 Oliveira Apply AI · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
