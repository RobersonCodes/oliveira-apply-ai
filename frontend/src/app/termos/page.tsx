import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Termos de Uso — Oliveira Apply AI' };

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-10 text-sm">
          <ArrowLeft className="w-4 h-4" />Voltar ao início
        </Link>

        <div className="prose prose-invert max-w-none space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
            <p className="text-white/40 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          {[
            {
              title: '1. Aceitação dos Termos',
              content: 'Ao acessar ou utilizar a plataforma Oliveira Apply AI ("Plataforma"), você concorda integralmente com estes Termos de Uso. Se não concordar, não utilize a Plataforma. Estes termos formam um contrato vinculante entre você ("Usuário") e Oliveira Apply AI ("Empresa").',
            },
            {
              title: '2. Descrição do Serviço',
              content: 'A Oliveira Apply AI é uma plataforma SaaS (Software as a Service) que oferece automação de candidaturas a vagas de emprego, otimização de currículos com inteligência artificial, análise de compatibilidade com sistemas ATS (Applicant Tracking Systems) e ferramentas de networking profissional. Os planos disponíveis são Gratuito, Starter (R$47/mês), Pro (R$97/mês) e Enterprise (R$197/mês).',
            },
            {
              title: '3. Cadastro e Conta',
              content: 'Para utilizar a Plataforma, você deve criar uma conta fornecendo informações verdadeiras e completas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.',
            },
            {
              title: '4. Uso Responsável',
              content: 'Você concorda em utilizar a Plataforma de forma ética e em conformidade com as políticas de uso de cada plataforma de emprego integrada (LinkedIn, Indeed, Glassdoor, Catho, etc.). É expressamente proibido: (a) usar a Plataforma para envio massivo de candidaturas fraudulentas; (b) criar perfis falsos; (c) violar as políticas de uso aceitável das plataformas de emprego; (d) realizar scraping ou coleta automatizada de dados de terceiros sem autorização; (e) tentar burlar sistemas de segurança.',
            },
            {
              title: '5. Pagamentos e Assinaturas',
              content: 'Os planos pagos são cobrados mensalmente via cartão de crédito, processados pela Stripe. O período de trial do plano Pro é de 7 dias sem cobrança. Após o período de trial, a cobrança é automática. Você pode cancelar a qualquer momento pelo painel de configurações, sem multa ou fidelidade. O cancelamento encerra o acesso ao fim do período pago.',
            },
            {
              title: '6. Propriedade Intelectual',
              content: 'Todo o conteúdo da Plataforma, incluindo código, design, textos e modelos de IA, é propriedade da Oliveira Apply AI. Os dados inseridos por você (currículo, perfil, preferências) permanecem de sua propriedade. Ao usar a Plataforma, você nos concede licença limitada para processar esses dados para prestar o serviço.',
            },
            {
              title: '7. Limitação de Responsabilidade',
              content: 'A Oliveira Apply AI não garante resultados específicos no processo seletivo. A Plataforma é uma ferramenta de auxílio; o sucesso nas candidaturas depende de múltiplos fatores fora de nosso controle. Não somos responsáveis por eventuais suspensões de contas em plataformas de emprego decorrentes do uso automatizado.',
            },
            {
              title: '8. Privacidade e LGPD',
              content: 'O tratamento de seus dados pessoais é regido pela nossa Política de Privacidade, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Você tem direito de acessar, corrigir, portar e solicitar a exclusão de seus dados a qualquer momento.',
            },
            {
              title: '9. Alterações nos Termos',
              content: 'Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações materiais serão comunicadas por email com 15 dias de antecedência. O uso continuado da Plataforma após a vigência das alterações constitui aceite dos novos termos.',
            },
            {
              title: '10. Foro',
              content: 'Estes Termos são regidos pelas leis do Brasil. Para dirimir controvérsias, fica eleito o foro da comarca de São Paulo/SP, renunciando-se a qualquer outro por mais privilegiado que seja.',
            },
            {
              title: '11. Contato',
              content: 'Para dúvidas sobre estes Termos, entre em contato: suporte@oliveira-apply.ai',
            },
          ].map(({ title, content }) => (
            <div key={title} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
              <p className="text-white/60 text-sm leading-relaxed">{content}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-4 text-sm text-white/40">
          <Link href="/privacidade" className="hover:text-white/70 transition-colors">Política de Privacidade</Link>
          <span>·</span>
          <Link href="/" className="hover:text-white/70 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
