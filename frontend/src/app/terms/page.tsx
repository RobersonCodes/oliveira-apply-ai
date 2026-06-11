import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso — Oliveira Apply AI',
  description: 'Termos de uso e condições do Oliveira Apply AI.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080812] text-white">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      <header className="border-b border-white/[0.06] sticky top-0 z-10 bg-[#080812]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold">OA</div>
            <span className="font-semibold text-white">Oliveira Apply AI</span>
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Termos de Uso</h1>
          <p className="text-white/50">Última atualização: 1 de junho de 2026</p>
        </div>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Aceitação dos termos</h2>
            <p>Ao criar uma conta no Oliveira Apply AI, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Descrição do serviço</h2>
            <p>O Oliveira Apply AI é uma plataforma de automação de candidaturas a empregos que utiliza inteligência artificial para:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Buscar vagas em múltiplas plataformas</li>
              <li>Adaptar currículos para cada vaga</li>
              <li>Realizar candidaturas automáticas em nome do usuário</li>
              <li>Fornecer analytics sobre o processo seletivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Responsabilidades do usuário</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Fornecer informações verídicas no cadastro e currículo</li>
              <li>Manter suas credenciais de acesso em segurança</li>
              <li>Utilizar o serviço apenas para fins legítimos de busca de emprego</li>
              <li>Respeitar os termos de uso das plataformas de emprego conectadas</li>
              <li>Não utilizar o serviço para spam ou candidaturas fraudulentas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Limitações do serviço</h2>
            <p>O Oliveira Apply AI não garante:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Que candidaturas automáticas resultarão em contratação</li>
              <li>Disponibilidade ininterrupta do serviço (meta de 99,5% de uptime)</li>
              <li>Que plataformas de emprego não alterem suas políticas bloqueando automações</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Pagamentos e cancelamento</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Planos mensais são cobrados antecipadamente via Stripe</li>
              <li>Cancelamentos têm efeito no final do período vigente</li>
              <li>Reembolsos podem ser solicitados em até 7 dias após a cobrança</li>
              <li>O plano gratuito não requer cartão de crédito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Propriedade intelectual</h2>
            <p>Todo o conteúdo da plataforma (código, design, marca) é propriedade do Oliveira Apply AI. O usuário mantém todos os direitos sobre seu currículo e dados pessoais.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Rescisão</h2>
            <p>Podemos suspender ou encerrar contas que violem estes termos, com notificação prévia por email exceto em casos de fraude ou violação grave.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Legislação aplicável</h2>
            <p>Estes termos são regidos pela legislação brasileira. Foro eleito: comarca de São Paulo, SP.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Contato</h2>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-white font-medium">Oliveira Apply AI</p>
              <p>Email: <a href="mailto:contato@oliveiraaply.ai" className="text-brand-400 hover:text-brand-300">contato@oliveiraaply.ai</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/[0.06] mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2026 Oliveira Apply AI. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-white/70">Termos de Uso</Link>
            <Link href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
