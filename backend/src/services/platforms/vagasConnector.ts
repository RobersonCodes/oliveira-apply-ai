/**
 * Vagas.com.br Connector
 * Grande volume de vagas de grandes empresas brasileiras
 */

import axios from 'axios';
import { Browser, Page, chromium } from 'playwright';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface VagasJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  skills: string[];
  seniorityLevel: string;
  jobType: string;
  applyUrl: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  platform: 'VAGAS';
}

export class VagasConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'pt-BR',
      viewport: { width: 1366, height: 768 },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    this.page = await context.newPage();
  }

  async searchJobs(params: {
    keywords: string;
    location?: string;
    remoteOnly?: boolean;
    maxResults?: number;
  }): Promise<VagasJob[]> {
    if (!this.page) await this.init();
    if (!this.page) return [];

    const encoded = encodeURIComponent(params.keywords);
    const location = params.location ? encodeURIComponent(params.location) : '';
    const url = `https://www.vagas.com.br/vagas-de-${encoded}${location ? `-em-${location}` : ''}`;

    logger.info('Vagas.com.br search', { url });

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randomBetween(2000, 4000));

    for (let i = 0; i < 3; i++) {
      await this.page.evaluate(() => window.scrollBy(0, 800));
      await sleep(1000);
    }

    const jobs = await this.page.evaluate(() => {
      const results: any[] = [];
      const cards = document.querySelectorAll('li.vaga, [class*="vaga-item"], [class*="job-item"]');

      cards.forEach(card => {
        try {
          const titleEl = card.querySelector('a.link-job-title, h2, [class*="title"]');
          const companyEl = card.querySelector('[class*="company"], [class*="empresa"], .nome-empresa');
          const locationEl = card.querySelector('[class*="location"], [class*="local"], .local-vaga');
          const dateEl = card.querySelector('[class*="date"], [class*="data"], .data-publicacao');
          const skillEls = card.querySelectorAll('[class*="tag"], [class*="skill"], .skill');
          const href = titleEl?.getAttribute('href') || card.querySelector('a')?.getAttribute('href') || '';

          if (!titleEl?.textContent) return;

          const isRemote = (locationEl?.textContent || '').toLowerCase().includes('home office') ||
            (locationEl?.textContent || '').toLowerCase().includes('remoto');

          results.push({
            id: href.split('/').pop() || String(Math.random()),
            externalId: href,
            title: titleEl.textContent.trim(),
            company: companyEl?.textContent?.trim() || 'Empresa',
            location: locationEl?.textContent?.trim() || 'Brasil',
            isRemote,
            description: '',
            skills: Array.from(skillEls).map(el => el.textContent?.trim()).filter(Boolean).slice(0, 6),
            seniorityLevel: 'MID',
            jobType: 'FULL_TIME',
            applyUrl: href.startsWith('http') ? href : `https://www.vagas.com.br${href}`,
            postedAt: new Date().toISOString(),
            daysAgo: 0,
            platform: 'VAGAS',
          });
        } catch { /* skip */ }
      });

      return results;
    });

    return jobs.slice(0, params.maxResults || 30);
  }

  async close(): Promise<void> {
    if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
  }
}

export const vagasConnector = new VagasConnector();
