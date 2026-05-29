/**
 * Unified Platforms Service
 * Busca em todas as plataformas simultaneamente e ranqueia com Neural
 */

import { RemoteOKConnector } from './remoteOKConnector';
import { WeWorkRemotelyConnector } from './weWorkRemotelyConnector';
import { WellfoundConnector } from './wellfoundConnector';
import { CathoConnector } from './cathoConnector';
import { VagasConnector } from './vagasConnector';
import { GlassdoorConnector } from './glassdoorConnector';
import { IndeedConnector } from './indeedConnector';
import { GeekHunterConnector } from './geekHunterConnector';
import { neuralService } from '../neural/neuralService';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export type Platform = 'REMOTEOK' | 'WEWORKREMOTELY' | 'WELLFOUND' | 'CATHO' | 'VAGAS' | 'GLASSDOOR' | 'INDEED' | 'GEEKHUNTER' | 'LINKEDIN';

export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  skills: string[];
  applyUrl: string;
  externalId: string;
  platform: Platform;
  daysAgo: number;
  neuralScore?: number;
  neuralShouldApply?: boolean;
  neuralReasoning?: string;
  extra?: Record<string, any>;
}

export interface MultiPlatformSearchParams {
  userId: string;
  keywords: string;
  location?: string;
  remoteOnly?: boolean;
  platforms: Platform[];
  maxPerPlatform?: number;
  minNeuralScore?: number;
}

export const platformsService = {

  async searchAll(params: MultiPlatformSearchParams): Promise<{
    results: UnifiedJob[];
    byPlatform: Record<string, number>;
    errors: Record<string, string>;
  }> {
    const results: UnifiedJob[] = [];
    const byPlatform: Record<string, number> = {};
    const errors: Record<string, string> = {};
    const max = params.maxPerPlatform || 15;

    const searches = params.platforms.map(async (platform) => {
      try {
        const jobs = await this.searchPlatform(platform, params, max);
        byPlatform[platform] = jobs.length;

        // Score neural em cada vaga
        const scored = await Promise.all(
          jobs.slice(0, 20).map(async (job) => {
            const prediction = await neuralService.predict(params.userId, {
              title: job.title,
              company: job.company,
              isRemote: job.isRemote,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              platform: job.platform,
              detectedSkills: job.skills,
            }).catch(() => null);

            return {
              ...job,
              neuralScore: prediction?.score,
              neuralShouldApply: prediction?.shouldApply,
              neuralReasoning: prediction?.reasoning?.summary,
            };
          }),
        );

        results.push(...scored);
        logger.info('Platform search done', { platform, count: jobs.length });
      } catch (err: any) {
        errors[platform] = err.message;
        logger.error('Platform search failed', { platform, err: err.message });
      }
    });

    await Promise.allSettled(searches);

    // Ordena por score neural desc, depois por dias ago asc
    const sorted = results.sort((a, b) => {
      const scoreDiff = (b.neuralScore || 0) - (a.neuralScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.daysAgo - b.daysAgo;
    });

    // Remove duplicatas (mesma vaga em múltiplas plataformas)
    const deduped = this.deduplicateJobs(sorted);

    return { results: deduped, byPlatform, errors };
  },

  async searchPlatform(platform: Platform, params: MultiPlatformSearchParams, max: number): Promise<UnifiedJob[]> {
    switch (platform) {
      case 'REMOTEOK': {
        const c = new RemoteOKConnector();
        const jobs = await c.searchJobs({ keywords: params.keywords, maxResults: max });
        return jobs.map(j => ({ ...j, salaryCurrency: 'USD', skills: j.tags }));
      }

      case 'WEWORKREMOTELY': {
        const c = new WeWorkRemotelyConnector();
        const jobs = await c.searchJobs({ keywords: params.keywords, maxResults: max });
        return jobs.map(j => ({ ...j, salaryCurrency: 'USD', skills: [] }));
      }

      case 'WELLFOUND': {
        const c = new WellfoundConnector();
        await c.init(true);
        try {
          const jobs = await c.searchJobs({ keywords: params.keywords, remote: params.remoteOnly, maxResults: max });
          return jobs.map(j => ({ ...j, salaryCurrency: 'USD' }));
        } finally { await c.close(); }
      }

      case 'GLASSDOOR': {
        const c = new GlassdoorConnector();
        await c.init(true);
        try {
          const jobs = await c.searchJobs({ keywords: params.keywords, location: params.location, remoteOnly: params.remoteOnly, maxResults: max });
          return jobs.map(j => ({ ...j, salaryCurrency: 'USD', skills: [] }));
        } finally { await c.close(); }
      }

      case 'CATHO': {
        const c = new CathoConnector();
        await c.init(true);
        try {
          const jobs = await c.searchJobs({ keywords: params.keywords, location: params.location, remoteOnly: params.remoteOnly, maxResults: max });
          return jobs.map(j => ({ ...j, salaryCurrency: 'BRL', skills: [] }));
        } finally { await c.close(); }
      }

      case 'VAGAS': {
        const c = new VagasConnector();
        await c.init(true);
        try {
          const jobs = await c.searchJobs({ keywords: params.keywords, location: params.location, remoteOnly: params.remoteOnly, maxResults: max });
          return jobs.map(j => ({ ...j, salaryCurrency: 'BRL' }));
        } finally { await c.close(); }
      }

      case 'INDEED': {
        const c = new IndeedConnector();
        await c.init(true);
        try {
          const jobs = await c.searchJobs({ keywords: params.keywords, location: params.location, remoteOnly: params.remoteOnly, maxResults: max });
          return jobs.map(j => ({ ...j, salaryCurrency: 'BRL', skills: [] }));
        } finally { await c.close(); }
      }

      case 'GEEKHUNTER': {
        const c = new GeekHunterConnector();
        const jobs = await c.searchJobs({ keywords: params.keywords, remoteOnly: params.remoteOnly, maxResults: max });
        return jobs.map(j => ({ ...j, salaryCurrency: 'BRL' }));
      }

      default:
        return [];
    }
  },

  deduplicateJobs(jobs: UnifiedJob[]): UnifiedJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase().slice(0, 20)}-${job.company.toLowerCase().slice(0, 15)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  getPlatformInfo() {
    return [
      { id: 'LINKEDIN', name: 'LinkedIn', flag: '💼', type: 'global', currency: 'BRL' },
      { id: 'INDEED', name: 'Indeed', flag: '🔍', type: 'global', currency: 'BRL/USD' },
      { id: 'GEEKHUNTER', name: 'GeekHunter', flag: '🎯', type: 'br', currency: 'BRL' },
      { id: 'REMOTEOK', name: 'Remote OK', flag: '🌍', type: 'remote', currency: 'USD' },
      { id: 'WEWORKREMOTELY', name: 'We Work Remotely', flag: '💻', type: 'remote', currency: 'USD' },
      { id: 'WELLFOUND', name: 'Wellfound', flag: '🚀', type: 'startup', currency: 'USD' },
      { id: 'GLASSDOOR', name: 'Glassdoor', flag: '⭐', type: 'global', currency: 'USD' },
      { id: 'CATHO', name: 'Catho', flag: '🇧🇷', type: 'br', currency: 'BRL' },
      { id: 'VAGAS', name: 'Vagas.com.br', flag: '🇧🇷', type: 'br', currency: 'BRL' },
    ];
  },
};
