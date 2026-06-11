import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — Oliveira Apply AI',
  description: 'Política de privacidade e proteção de dados do Oliveira Apply AI.',
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-3">Política de Privacidade</h1>
          <p className="text-white/50">Última atualização: 1 de junho de 2026</p>
        </div>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Quem somos</h2>
            <p>O Oliveira Apply AI é uma plataforma SaaS brasileira de automação de candidaturas com inteligência artificial. Nosso objetivo é ajudar profissionais a encontrar oportunidades de emprego de forma mais eficiente e inteligente.</p>
            <p className="mt-3">Para dúvidas: <a href="mailto:privacidade@oliveiraaply.ai" className="text-brand-400 hover:text-brand-300">privacidade@oliveiraaply.ai</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Dados que coletamos</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="text-white font-medium">Dados de cadastro:</span> nome, email e senha (criptografada)</li>
              <li><span className="text-white font-medium">Currículo:</span> conteúdo do seu currículo para adaptação com IA</li>
              <li><span className="text-white font-medium">Credenciais de plataformas:</span> armazenadas com criptografia AES-256</li>
              <li><span className="text-white font-medium">Dados de uso:</span> candidaturas realizadas e métricas de desempenho</li>
              <li><span className="text-white font-medium">Dados de pagamento:</span> processados exclusivamente pelo Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Como usamos seus dados</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Automatizar candidaturas em plataformas de emprego em seu nome</li>
              <li>Adaptar seu currículo com IA para cada vaga</li>
              <li>Gerar analytics e relatórios sobre suas candidaturas</li>
              <li>Enviar notificações sobre o status das candidaturas</li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm">
              Seus dados nunca são vendidos, compartilhados com terceiros para fins comerciais ou usados para publicidade.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Segurança</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Senhas criptografadas com bcrypt</li>
              <li>Credenciais de plataformas criptografadas com AES-256-GCM</li>
              <li>Comunicação exclusivamente via HTTPS/TLS</li>
              <li>Tokens JWT com expiração de 15 minutos</li>
              <li>Infraestrutura em nuvem com backups diários</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Seus direitos (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar, corrigir, excluir e portar seus dados a qualquer momento em <span className="text-white">Configurações → Minha conta → Excluir conta</span>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Compartilhamento</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="text-white font-medium">OpenAI:</span> textos de currículos para adaptação com IA (sem dados pessoais identificáveis)</li>
              <li><span className="text-white font-medium">Stripe:</span> dados de pagamento para processamento de assinaturas</li>
              <li><span className="text-white font-medium">Railway/Vercel:</span> infraestrutura de hospedagem</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Contato</h2>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-white font-medium">Oliveira Apply AI</p>
              <p>Email: <a href="mailto:privacidade@oliveiraaply.ai" className="text-brand-400 hover:text-brand-300">privacidade@oliveiraaply.ai</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/[0.06] mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2026 Oliveira Apply AI. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-white/40 hover:text-white/70 transition-colors">Termos de Uso</Link>
            <Link href="/privacy" className="text-sm text-white/70">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
