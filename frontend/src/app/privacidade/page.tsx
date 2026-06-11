import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Política de Privacidade — Oliveira Apply AI' };

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-10 text-sm">
          <ArrowLeft className="w-4 h-4" />Voltar ao início
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
            <p className="text-white/40 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-white/50 text-sm mt-3">Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </div>

          {[
            {
              title: '1. Controlador de Dados',
              content: 'Oliveira Apply AI é a controladora dos dados pessoais coletados nesta Plataforma. Contato do encarregado (DPO): privacidade@oliveira-apply.ai',
            },
            {
              title: '2. Dados que Coletamos',
              items: [
                'Dados de cadastro: nome, e-mail, senha (armazenada em hash bcrypt)',
                'Dados de perfil: localização, cargo desejado, habilidades, experiências',
                'Dados profissionais: conteúdo do currículo, histórico de candidaturas',
                'Credenciais de plataformas de emprego: criptografadas com AES-256-GCM, nunca em texto simples',
                'Dados de uso: logs de automação, métricas de candidaturas, interações com a IA',
                'Dados de pagamento: processados pela Stripe; não armazenamos dados de cartão',
                'Dados técnicos: endereço IP, tipo de navegador, cookies de sessão',
              ],
            },
            {
              title: '3. Finalidade e Base Legal',
              items: [
                'Execução do serviço contratado (Art. 7º, V — execução de contrato): automação de candidaturas, otimização de currículo, análise de vagas',
                'Legítimo interesse (Art. 7º, IX): melhoria dos modelos de IA, segurança da plataforma, prevenção de fraudes',
                'Cumprimento de obrigação legal (Art. 7º, II): obrigações fiscais, retenção de logs conforme legislação aplicável',
                'Consentimento (Art. 7º, I): comunicações de marketing, quando aplicável',
              ],
            },
            {
              title: '4. Compartilhamento de Dados',
              items: [
                'Stripe: processamento de pagamentos (política: stripe.com/privacy)',
                'OpenAI: processamento de textos para geração de IA (dados não são usados para treino)',
                'Railway/Vercel: infraestrutura de hospedagem',
                'Plataformas de emprego: apenas as credenciais que você autorizar explicitamente',
                'Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing',
              ],
            },
            {
              title: '5. Seus Direitos (LGPD Art. 18)',
              items: [
                'Confirmação: saber se tratamos seus dados',
                'Acesso: obter cópia dos seus dados',
                'Correção: corrigir dados incompletos ou incorretos',
                'Anonimização, bloqueio ou eliminação: de dados desnecessários ou excessivos',
                'Portabilidade: receber seus dados em formato estruturado',
                'Eliminação: deletar dados tratados com base em consentimento',
                'Informação sobre compartilhamento: saber com quem compartilhamos',
                'Revogação do consentimento: a qualquer momento',
              ],
              footer: 'Para exercer seus direitos, envie solicitação para: privacidade@oliveira-apply.ai',
            },
            {
              title: '6. Segurança',
              content: 'Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia AES-256-GCM para credenciais sensíveis, TLS/HTTPS em todas as comunicações, senhas em hash bcrypt, tokens JWT com expiração, auditoria de acesso, infraestrutura em provedores certificados (ISO 27001). Em caso de incidente de segurança, notificaremos você e a ANPD conforme exigido pela LGPD.',
            },
            {
              title: '7. Retenção de Dados',
              content: 'Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados pessoais são eliminados em até 30 dias, exceto quando a retenção for exigida por obrigação legal (ex.: dados fiscais por 5 anos).',
            },
            {
              title: '8. Cookies',
              content: 'Utilizamos cookies estritamente necessários para sessão e autenticação. Não utilizamos cookies de rastreamento de terceiros para publicidade.',
            },
            {
              title: '9. Alterações nesta Política',
              content: 'Podemos atualizar esta Política periodicamente. Alterações materiais serão comunicadas por email. A data da última atualização está sempre indicada no topo deste documento.',
            },
            {
              title: '10. Contato e Reclamações',
              content: 'Dúvidas ou solicitações: privacidade@oliveira-apply.ai. Você também pode apresentar reclamação à ANPD (Autoridade Nacional de Proteção de Dados): gov.br/anpd',
            },
          ].map(({ title, content, items, footer }: any) => (
            <div key={title} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
              {content && <p className="text-white/60 text-sm leading-relaxed">{content}</p>}
              {items && (
                <ul className="space-y-2">
                  {items.map((item: string) => (
                    <li key={item} className="flex items-start gap-2 text-white/60 text-sm">
                      <span className="text-brand-400 mt-1 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {footer && <p className="text-white/40 text-xs mt-3 border-t border-white/[0.06] pt-3">{footer}</p>}
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-4 text-sm text-white/40">
          <Link href="/termos" className="hover:text-white/70 transition-colors">Termos de Uso</Link>
          <span>·</span>
          <Link href="/" className="hover:text-white/70 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
