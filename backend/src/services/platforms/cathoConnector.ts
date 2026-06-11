/**
 * Catho Connector
 * Maior plataforma CLT do Brasil — via Playwright
 */

import { Browser, Page, chromium } from 'playwright';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface CathoJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  benefits: string[];
  jobType: string;
  seniorityLevel: string;
  applyUrl: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  platform: 'CATHO';
}

export interface CathoSearchParams {
  keywords: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  jobType?: string;
  maxResults?: number;
}

const CATHO_BASE = 'https://www.catho.com.br';

export class CathoConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--lang=pt-BR'],
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

  async searchJobs(params: CathoSearchParams): Promise<CathoJob[]> {
    if (!this.page) await this.init();
    if (!this.page) return [];

    const url = this.buildUrl(params);
    logger.info('Catho search', { url });

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randomBetween(2000, 4000));

    // Scroll para carregar mais
    for (let i = 0; i < 3; i++) {
      await this.page.evaluate(() => window.scrollBy(0, 800));
      await sleep(1000);
    }

    const jobs = await this.page.evaluate(() => {
      const results: any[] = [];
      const cards = document.querySelectorAll('[class*="JobCard"], [class*="job-card"], li[class*="job"]');

      cards.forEach(card => {
        try {
          const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="cargo"]');
          const companyEl = card.querySelector('[class*="company"], [class*="empresa"]');
          const locationEl = card.querySelector('[class*="location"], [class*="local"]');
          const salaryEl = card.querySelector('[class*="salary"], [class*="salario"]');
          const linkEl = card.querySelector('a');
          const dateEl = card.querySelector('[class*="date"], [class*="data"]');
          const benefitEls = card.querySelectorAll('[class*="benefit"], [class*="beneficio"]');

          if (!titleEl?.textContent) return;

          const salary = salaryEl?.textContent?.trim() || '';
          const salaryMatch = salary.match(/R\$\s*([\d.,]+)/g);
          const salaryValues = salaryMatch?.map(s => parseFloat(s.replace('R$', '').replace('.', '').replace(',', '.')));

          const href = linkEl?.getAttribute('href') || '';

          results.push({
            id: href.split('/').pop() || String(Math.random()),
            externalId: href,
            title: titleEl.textContent.trim(),
            company: companyEl?.textContent?.trim() || 'Empresa Confidencial',
            location: locationEl?.textContent?.trim() || 'Brasil',
            isRemote: (locationEl?.textContent || '').toLowerCase().includes('home office') ||
              (locationEl?.textContent || '').toLowerCase().includes('remoto'),
            salaryMin: salaryValues?.[0],
            salaryMax: salaryValues?.[1],
            description: '',
            benefits: Array.from(benefitEls).map(el => el.textContent?.trim()).filter(Boolean),
            jobType: 'FULL_TIME',
            seniorityLevel: 'MID',
            applyUrl: href.startsWith('http') ? href : `https://www.catho.com.br${href}`,
            postedAt: new Date().toISOString(),
            daysAgo: 0,
            platform: 'CATHO',
          });
        } catch { /* skip */ }
      });

      return results;
    });

    return jobs.slice(0, params.maxResults || 30);
  }

  private buildUrl(params: CathoSearchParams): string {
    const encoded = encodeURIComponent(params.keywords);
    let url = `${CATHO_BASE}/vagas/${encoded}`;
    if (params.location) url += `/${encodeURIComponent(params.location)}`;
    if (params.remoteOnly) url += '?home_office=1';
    return url;
  }

  async close(): Promise<void> {
    if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
  }
}

export const cathoConnector = new CathoConnector();
