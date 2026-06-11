// src/jobs/emailDigest.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import logger from '../utils/logger';

/**
 * Roda todo dia às 8h (horário de Brasília = UTC-3 → 11h UTC)
 * Envia resumo diário para usuários com preferências configuradas
 * e que tenham autoApplyEnabled ou plataformas ativas
 */
export function startEmailDigestJob() {
  // Cron: segundos minutos horas dia mês diaDaSemana
  // '0 11 * * *' = 11h UTC = 8h Brasília
  cron.schedule('0 11 * * *', async () => {
    logger.info('[emailDigest] Starting daily digest job');

    try {
      // Buscar usuários ativos com preferências preenchidas
      const usersWithPrefs = await prisma.userPreferences.findMany({
        where: {
          jobTitle: { not: null },
          platforms: { isEmpty: false },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      let sent = 0;
      let skipped = 0;

      for (const pref of usersWithPrefs) {
        const user = pref.user;
        if (!user.isActive) { skipped++; continue; }

        // Contar vagas/candidaturas criadas hoje para este usuário
        const todayCount = await prisma.application.count({
          where: {
            userId: user.id,
            createdAt: { gte: startOfToday },
          },
        });

        // Só envia se encontrou algo hoje (evita email em dia sem atividade)
        if (todayCount === 0) { skipped++; continue; }

        await emailService.sendDailyDigest(
          user.email,
          user.name.split(' ')[0],
          todayCount,
          pref.jobTitle!,
        );
        sent++;

        // Criar notificação no banco também
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Resumo diário enviado',
            message: `Encontramos ${todayCount} vagas para ${pref.jobTitle} hoje.`,
            type: 'digest',
          },
        });
      }

      logger.info(`[emailDigest] Done — sent: ${sent}, skipped: ${skipped}`);
    } catch (err) {
      logger.error('[emailDigest] Job failed', { err });
    }
  });

  logger.info('[emailDigest] Daily digest job scheduled — runs at 8h BRT (11h UTC)');
}
