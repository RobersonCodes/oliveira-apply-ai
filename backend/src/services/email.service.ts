// src/services/email.service.ts
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// ─── Transporter ─────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { ciphers: 'SSLv3' },
  });
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Oliveira Apply AI</title>
</head>
<body style="margin:0;padding:0;background:#0a0a18;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a18;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#12121f;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:14px;">OA</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#fff;font-weight:600;font-size:15px;">Oliveira Apply AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">
                Oliveira Apply AI · Você está recebendo este email pois tem uma conta ativa.<br/>
                <a href="https://oliveira-apply-ai-okbt.vercel.app/dashboard/settings" style="color:#7c3aed;">Gerenciar notificações</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Templates específicos ────────────────────────────────────────────────────

function dailyDigestTemplate(name: string, vagasCount: number, jobTitle: string): string {
  return baseTemplate(`
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">
      Bom dia, ${name}! 👋
    </h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">
      Aqui está o resumo de vagas de hoje para <strong style="color:#a78bfa;">${jobTitle}</strong>
    </p>

    <!-- Destaque -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,102,241,0.1));border:1px solid rgba(124,58,237,0.3);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <div style="font-size:48px;font-weight:800;color:#a78bfa;line-height:1;">${vagasCount}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:14px;margin-top:4px;">novas vagas encontradas hoje</div>
        </td>
      </tr>
    </table>

    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 24px;line-height:1.6;">
      O Oliveira Apply AI está monitorando as principais plataformas em tempo real. 
      Acesse o dashboard para ver as vagas e iniciar candidaturas automáticas.
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="https://oliveira-apply-ai-okbt.vercel.app/dashboard/vaga-radar" 
             style="color:#fff;font-weight:600;font-size:14px;text-decoration:none;">
            Ver vagas encontradas →
          </a>
        </td>
      </tr>
    </table>
  `);
}

function applicationSentTemplate(name: string, jobTitle: string, company: string, platform: string): string {
  return baseTemplate(`
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">
      Candidatura enviada! ✅
    </h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">
      O Oliveira Apply AI se candidatou em seu nome
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <div style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Vaga</div>
          <div style="color:#fff;font-size:16px;font-weight:600;">${jobTitle}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:24px;">
                <div style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Empresa</div>
                <div style="color:rgba(255,255,255,0.8);font-size:14px;">${company}</div>
              </td>
              <td>
                <div style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Plataforma</div>
                <div style="color:rgba(255,255,255,0.8);font-size:14px;">${platform}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="https://oliveira-apply-ai-okbt.vercel.app/dashboard/applications"
             style="color:#fff;font-weight:600;font-size:14px;text-decoration:none;">
            Ver candidaturas →
          </a>
        </td>
      </tr>
    </table>
  `);
}

function applicationViewedTemplate(name: string, jobTitle: string, company: string): string {
  return baseTemplate(`
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">
      Empresa visualizou seu perfil! 👀
    </h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">
      Boa notícia — um recrutador viu sua candidatura
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <div style="color:#a78bfa;font-size:14px;font-weight:600;">${company}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:4px;">visualizou sua candidatura para <strong style="color:#fff;">${jobTitle}</strong></div>
        </td>
      </tr>
    </table>

    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 24px;line-height:1.6;">
      Este é um sinal positivo! Considere enviar um follow-up caso não receba retorno em 7 dias.
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="https://oliveira-apply-ai-okbt.vercel.app/dashboard/applications"
             style="color:#fff;font-weight:600;font-size:14px;text-decoration:none;">
            Ver candidatura →
          </a>
        </td>
      </tr>
    </table>
  `);
}

// ─── Serviço de email ─────────────────────────────────────────────────────────

export const emailService = {

  async sendDailyDigest(to: string, name: string, vagasCount: number, jobTitle: string) {
    if (!process.env.SMTP_USER) {
      logger.warn('SMTP not configured — skipping daily digest email');
      return;
    }
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Oliveira Apply AI" <${process.env.FROM_EMAIL}>`,
        to,
        subject: `🎯 ${vagasCount} novas vagas para ${jobTitle} hoje`,
        html: dailyDigestTemplate(name, vagasCount, jobTitle),
      });
      logger.info('Daily digest email sent', { to, vagasCount });
    } catch (err) {
      logger.error('Failed to send daily digest email', { err, to });
    }
  },

  async sendApplicationSent(to: string, name: string, jobTitle: string, company: string, platform: string) {
    if (!process.env.SMTP_USER) return;
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Oliveira Apply AI" <${process.env.FROM_EMAIL}>`,
        to,
        subject: `✅ Candidatura enviada: ${jobTitle} na ${company}`,
        html: applicationSentTemplate(name, jobTitle, company, platform),
      });
      logger.info('Application sent email dispatched', { to, jobTitle, company });
    } catch (err) {
      logger.error('Failed to send application sent email', { err, to });
    }
  },

  async sendApplicationViewed(to: string, name: string, jobTitle: string, company: string) {
    if (!process.env.SMTP_USER) return;
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Oliveira Apply AI" <${process.env.FROM_EMAIL}>`,
        to,
        subject: `👀 ${company} visualizou sua candidatura para ${jobTitle}`,
        html: applicationViewedTemplate(name, jobTitle, company),
      });
      logger.info('Application viewed email dispatched', { to, jobTitle, company });
    } catch (err) {
      logger.error('Failed to send application viewed email', { err, to });
    }
  },

  async testConnection(): Promise<boolean> {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      logger.info('SMTP connection verified OK');
      return true;
    } catch (err) {
      logger.error('SMTP connection failed', { err });
      return false;
    }
  },
};
