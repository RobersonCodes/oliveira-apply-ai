/**
 * Wellfound (AngelList) Connector
 * Scraper via Playwright — maior portal de startups do mundo
 */

import { Browser, Page, chromium } from 'playwright';
import axios from 'axios';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface WellfoundJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  equity?: string;
  description: string;
  skills: string[];
  companyStage?: string;
  companySize?: string;
  applyUrl: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  platform: 'WELLFOUND';
}

export interface WellfoundSearchParams {
  keywords?: string;
  role?: string;
  location?: string;
  remote?: boolean;
  jobTypes?: string[];
  maxResults?: number;
}

const WELLFOUND_BASE = 'https://wellfound.com';

export class WellfoundConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--lang=en-US'],
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'en-US',
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    this.page = await context.newPage();
  }

  async searchJobs(params: WellfoundSearchParams): Promise<WellfoundJob[]> {
    if (!this.page) await this.init();
    if (!this.page) return [];

    const url = this.buildUrl(params);
    logger.info('Wellfound search', { url });

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randomBetween(3000, 5000));

    // Scroll para carregar mais vagas
    for (let i = 0; i < 3; i++) {
      await this.page.evaluate(() => window.scrollBy(0, 800));
      await sleep(randomBetween(1000, 2000));
    }

    const jobs = await this.page.evaluate(() => {
      const results: any[] = [];
      const cards = document.querySelectorAll('[class*="JobListing"], [data-test*="job"], article[class*="job"]');

      cards.forEach(card => {
        try {
          const titleEl = card.querySelector('h2, h3, [class*="title"]');
          const companyEl = card.querySelector('[class*="company"], [class*="startup"]');
          const locationEl = card.querySelector('[class*="location"]');
          const salaryEl = card.querySelector('[class*="salary"], [class*="compensation"]');
          const equityEl = card.querySelector('[class*="equity"]');
          const linkEl = card.querySelector('a[href*="/jobs/"]');
          const stageEl = card.querySelector('[class*="stage"]');
          const skillEls = card.querySelectorAll('[class*="tag"], [class*="skill"]');

          if (!titleEl?.textContent || !companyEl?.textContent) return;

          const href = linkEl?.getAttribute('href') || '';
          const salary = salaryEl?.textContent?.trim() || '';
          const salaryMatch = salary.match(/\$?([\d,]+)k?\s*[-–]\s*\$?([\d,]+)k?/i);

          results.push({
            id: href.split('/').pop() || String(Math.random()),
            externalId: href,
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl?.textContent?.trim() || 'Remote',
            isRemote: (locationEl?.textContent || '').toLowerCase().includes('remote'),
            salaryMin: salaryMatch ? parseInt(salaryMatch[1].replace(',', '')) * (salary.includes('k') ? 1000 : 1) : undefined,
            salaryMax: salaryMatch ? parseInt(salaryMatch[2].replace(',', '')) * (salary.includes('k') ? 1000 : 1) : undefined,
            equity: equityEl?.textContent?.trim(),
            description: '',
            skills: Array.from(skillEls).map(el => el.textContent?.trim()).filter(Boolean).slice(0, 8),
            companyStage: stageEl?.textContent?.trim(),
            applyUrl: href.startsWith('http') ? href : `https://wellfound.com${href}`,
            postedAt: new Date().toISOString(),
            daysAgo: 0,
            platform: 'WELLFOUND',
          });
        } catch { /* skip */ }
      });

      return results;
    });

    return jobs.slice(0, params.maxResults || 30);
  }

  private buildUrl(params: WellfoundSearchParams): string {
    const url = new URL(`${WELLFOUND_BASE}/jobs`);
    if (params.keywords) url.searchParams.set('q', params.keywords);
    if (params.role) url.searchParams.set('role', params.role);
    if (params.remote) url.searchParams.set('remote', 'true');
    if (params.location) url.searchParams.set('location', params.location);
    return url.toString();
  }

  async close(): Promise<void> {
    if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
  }

  getRoles() {
    return ['Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer',
      'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'Mobile Engineer'];
  }
}

export const wellfoundConnector = new WellfoundConnector();
