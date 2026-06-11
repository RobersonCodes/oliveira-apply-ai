/**
 * Remote OK Connector
 * Usa RSS/JSON feed oficial — sem Playwright, super rápido
 */

import axios from 'axios';
import logger from '../../utils/logger';

export interface RemoteOKJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  tags: string[];
  applyUrl: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  platform: 'REMOTEOK';
}

export interface RemoteOKSearchParams {
  tags?: string[];
  keywords?: string;
  maxResults?: number;
}

export class RemoteOKConnector {
  private readonly API = 'https://remoteok.com/api';

  async searchJobs(params: RemoteOKSearchParams): Promise<RemoteOKJob[]> {
    try {
      const url = params.tags?.length
        ? `${this.API}?tags=${params.tags.join(',')}`
        : this.API;

      logger.info('RemoteOK fetch', { url });

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        timeout: 15000,
      });

      // Primeiro item é metadata, resto são vagas
      const jobs = Array.isArray(data) ? data.slice(1) : [];

      const mapped: RemoteOKJob[] = jobs
        .filter((j: any) => j.position || j.company)
        .map((j: any) => ({
          id: String(j.id || j.slug),
          externalId: String(j.id || j.slug),
          title: j.position || j.title || '',
          company: j.company || '',
          companyLogo: j.company_logo,
          location: 'Remote — Worldwide',
          isRemote: true,
          salaryMin: j.salary_min ? parseInt(j.salary_min) : undefined,
          salaryMax: j.salary_max ? parseInt(j.salary_max) : undefined,
          description: j.description || '',
          tags: j.tags || [],
          applyUrl: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.slug}`,
          postedAt: j.date || new Date().toISOString(),
          daysAgo: this.parseDaysAgo(j.date),
          platform: 'REMOTEOK' as const,
        }));

      // Filtra por keywords se fornecido
      const filtered = params.keywords
        ? mapped.filter(j =>
            j.title.toLowerCase().includes(params.keywords!.toLowerCase()) ||
            j.tags.some(t => t.toLowerCase().includes(params.keywords!.toLowerCase())),
          )
        : mapped;

      return filtered.slice(0, params.maxResults || 30);
    } catch (err: any) {
      logger.error('RemoteOK fetch failed', { err: err.message });
      return [];
    }
  }

  private parseDaysAgo(dateStr: string): number {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getPopularTags() {
    return ['node', 'react', 'typescript', 'python', 'go', 'backend', 'frontend', 'fullstack', 'devops', 'aws', 'senior', 'api'];
  }
}

export const remoteOKConnector = new RemoteOKConnector();
