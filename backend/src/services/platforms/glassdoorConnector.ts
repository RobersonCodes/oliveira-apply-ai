/**
 * Glassdoor Connector
 * Vagas + salários + avaliações da empresa
 */

import { Browser, Page, chromium } from 'playwright';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface GlassdoorJob {
  id: string;
  title: string;
  company: string;
  companyRating?: number;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  applyUrl: string;
  companyReviewUrl?: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  easyApply: boolean;
  platform: 'GLASSDOOR';
  country: string;
}

export class GlassdoorConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      locale: 'en-US',
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });
    this.page = await context.newPage();
  }

  async searchJobs(params: {
    keywords: string;
    location?: string;
    remoteOnly?: boolean;
    country?: 'br' | 'us' | 'uk';
    maxResults?: number;
  }): Promise<GlassdoorJob[]> {
    if (!this.page) await this.init();
    if (!this.page) return [];

    const baseUrl = params.country === 'br'
      ? 'https://www.glassdoor.com.br'
      : params.country === 'uk'
      ? 'https://www.glassdoor.co.uk'
      : 'https://www.glassdoor.com';

    const keywordsEncoded = encodeURIComponent(params.keywords);
    const locationEncoded = params.location ? encodeURIComponent(params.location) : '';
    const url = `${baseUrl}/Jobs/${locationEncoded ? `${locationEncoded}-` : ''}${keywordsEncoded}-jobs-SRCH_KO0,${params.keywords.length}.htm`;

    logger.info('Glassdoor search', { url });

    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(randomBetween(3000, 5000));

    // Fecha modal de login se aparecer
    const closeBtn = await this.page.$('[alt="Close"], [data-test="modal-close"], .modal-close');
    if (closeBtn) {
      await closeBtn.click();
      await sleep(1000);
    }

    const jobs = await this.page.evaluate((country) => {
      const results: any[] = [];
      const cards = document.querySelectorAll('[data-test="jobListing"], li[class*="JobsList"], [class*="jl "]');

      cards.forEach(card => {
        try {
          const titleEl = card.querySelector('[data-test="job-title"], a[class*="jobTitle"]');
          const companyEl = card.querySelector('[data-test="employer-name"], [class*="employerName"]');
          const locationEl = card.querySelector('[data-test="location"], [class*="location"]');
          const ratingEl = card.querySelector('[class*="rating"], [data-test="rating"]');
          const salaryEl = card.querySelector('[data-test="detailSalary"], [class*="salary"]');
          const easyApplyEl = card.querySelector('[data-test="easy-apply"]');
          const href = titleEl?.getAttribute('href') || card.querySelector('a')?.getAttribute('href') || '';

          if (!titleEl?.textContent) return;

          const salary = salaryEl?.textContent?.trim() || '';
          const salaryMatch = salary.match(/\$?([\d,]+)K?\s*[-–]\s*\$?([\d,]+)K?/i);

          results.push({
            id: href.split('?')[0].split('/').pop() || String(Math.random()),
            externalId: href,
            title: titleEl.textContent.trim(),
            company: companyEl?.textContent?.trim() || '',
            companyRating: ratingEl ? parseFloat(ratingEl.textContent?.trim() || '0') : undefined,
            location: locationEl?.textContent?.trim() || '',
            isRemote: (locationEl?.textContent || '').toLowerCase().includes('remote'),
            salaryMin: salaryMatch ? parseInt(salaryMatch[1].replace(',', '')) * (salary.includes('K') ? 1000 : 1) : undefined,
            salaryMax: salaryMatch ? parseInt(salaryMatch[2].replace(',', '')) * (salary.includes('K') ? 1000 : 1) : undefined,
            description: '',
            applyUrl: href.startsWith('http') ? href : `https://www.glassdoor.com${href}`,
            easyApply: !!easyApplyEl,
            postedAt: new Date().toISOString(),
            daysAgo: 0,
            platform: 'GLASSDOOR',
            country: country || 'us',
          });
        } catch { /* skip */ }
      });

      return results;
    }, params.country || 'us');

    return jobs.slice(0, params.maxResults || 30);
  }

  async close(): Promise<void> {
    if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
  }
}

export const glassdoorConnector = new GlassdoorConnector();
