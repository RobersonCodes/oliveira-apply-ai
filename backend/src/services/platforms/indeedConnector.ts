/**
 * Indeed Connector
 * 
 * Fluxo:
 * 1. Busca vagas no Indeed com filtros do usuário
 * 2. Extrai dados de cada vaga (título, empresa, salário, descrição)
 * 3. Detecta se tem "Easy Apply" do Indeed ou redireciona para empresa
 * 4. Para Easy Apply: preenche formulário via Playwright
 * 5. Para redirect: usa Recruiter Vision para otimizar e aplica no ATS da empresa
 */

import { Browser, Page, chromium } from 'playwright';
import logger from '../../utils/logger';
import { randomBetween, sleep } from '../../utils/helpers';

export interface IndeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote: boolean;
  description: string;
  applyUrl: string;
  isEasyApply: boolean;
  postedDate: string;
  daysAgo: number;
  jobType?: string;
  platform: 'INDEED';
  externalId: string;
}

export interface IndeedSearchParams {
  keywords: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  datePosted?: 'today' | '3days' | '7days' | '14days';
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'internship';
  maxResults?: number;
  country?: 'br' | 'us' | 'uk' | 'ca' | 'au' | 'de' | 'fr' | 'nl' | 'pt';
}

// URLs base por país
const INDEED_BASE_URLS: Record<string, string> = {
  br: 'https://br.indeed.com',
  us: 'https://www.indeed.com',
  uk: 'https://uk.indeed.com',
  ca: 'https://ca.indeed.com',
  au: 'https://au.indeed.com',
  de: 'https://de.indeed.com',
  fr: 'https://fr.indeed.com',
  nl: 'https://www.indeed.nl',
  pt: 'https://www.indeed.pt',
};

function parseSalary(salaryText: string): { min?: number; max?: number } {
  const numbers = salaryText.match(/[\d.,]+/g);
  if (!numbers) return {};
  const values = numbers.map(n => parseFloat(n.replace(',', '.'))).filter(n => n > 100);
  if (values.length === 0) return {};
  if (values.length === 1) return { min: values[0], max: values[0] };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function parseDaysAgo(text: string): number {
  if (text.includes('hoje') || text.includes('today') || text.includes('agora')) return 0;
  if (text.includes('ontem') || text.includes('yesterday')) return 1;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

export class IndeedConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--lang=pt-BR,pt,en-US,en',
      ],
    });

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    // Anti-detecção
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });

    this.page = await context.newPage();
  }

  async searchJobs(params: IndeedSearchParams): Promise<IndeedJob[]> {
    if (!this.page) throw new Error('Browser não iniciado');

    const baseUrl = INDEED_BASE_URLS[params.country || 'br'];
    const jobs: IndeedJob[] = [];
    const maxResults = params.maxResults || 50;
    let page = 0;

    while (jobs.length < maxResults) {
      const url = this.buildSearchUrl(baseUrl, params, page);
      logger.info('Indeed search', { url, page, found: jobs.length });

      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(randomBetween(2000, 4000));

      // Verifica CAPTCHA
      const hasCaptcha = await this.page.$('[id*="captcha"], [class*="captcha"]');
      if (hasCaptcha) {
        logger.warn('Indeed CAPTCHA detected — pausing');
        await sleep(randomBetween(15000, 30000));
        break;
      }

      const pageJobs = await this.extractJobsFromPage(baseUrl);
      if (pageJobs.length === 0) break;

      jobs.push(...pageJobs);

      // Verifica se tem próxima página
      const hasNext = await this.page.$('[data-testid="pagination-page-next"], a[aria-label="Next Page"]');
      if (!hasNext) break;

      page += 10;
      await sleep(randomBetween(3000, 6000));
    }

    return jobs.slice(0, maxResults);
  }

  private buildSearchUrl(baseUrl: string, params: IndeedSearchParams, start: number): string {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.keywords);
    if (params.location) searchParams.set('l', params.location);
    if (params.remoteOnly) searchParams.set('remotejob', '1');
    if (params.salaryMin) searchParams.set('salary', params.salaryMin.toString());
    if (params.datePosted) {
      const fromage: Record<string, string> = { today: '1', '3days': '3', '7days': '7', '14days': '14' };
      searchParams.set('fromage', fromage[params.datePosted] || '14');
    }
    if (params.jobType) searchParams.set('jt', params.jobType);
    if (start > 0) searchParams.set('start', start.toString());

    return `${baseUrl}/jobs?${searchParams.toString()}`;
  }

  private async extractJobsFromPage(baseUrl: string): Promise<IndeedJob[]> {
    if (!this.page) return [];

    return await this.page.evaluate((base) => {
      const jobs: any[] = [];
      const cards = document.querySelectorAll('[data-jk], .job_seen_beacon, [class*="jobCard"]');

      cards.forEach(card => {
        try {
          const titleEl = card.querySelector('[class*="jobTitle"] a, h2.jobTitle a, .title a');
          const companyEl = card.querySelector('[data-testid="company-name"], .companyName, [class*="company"]');
          const locationEl = card.querySelector('[data-testid="text-location"], .companyLocation, [class*="location"]');
          const salaryEl = card.querySelector('[class*="salary"], .salary-snippet, [data-testid*="salary"]');
          const dateEl = card.querySelector('[class*="date"], .date, [data-testid="myJobsStateDate"]');
          const jobId = card.getAttribute('data-jk') || card.getAttribute('id') || '';
          const isEasyApply = card.innerHTML.includes('Candidatura simplificada') ||
            card.innerHTML.includes('Easy Apply') ||
            card.innerHTML.includes('Indeed Apply');

          if (!titleEl || !companyEl) return;

          const title = titleEl.textContent?.trim() || '';
          const company = companyEl.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const salary = salaryEl?.textContent?.trim() || '';
          const dateText = dateEl?.textContent?.trim() || '';
          const href = titleEl.getAttribute('href') || '';
          const applyUrl = href.startsWith('http') ? href : `${base}${href}`;

          if (!title || !company) return;

          jobs.push({
            id: jobId,
            externalId: jobId,
            title,
            company,
            location,
            salary,
            isRemote: location.toLowerCase().includes('remoto') || location.toLowerCase().includes('remote') || location.toLowerCase().includes('home office'),
            description: '',
            applyUrl,
            isEasyApply,
            postedDate: dateText,
            daysAgo: 0,
            platform: 'INDEED',
          });
        } catch { /* skip */ }
      });

      return jobs;
    }, baseUrl);
  }

  async getJobDetails(job: IndeedJob): Promise<IndeedJob> {
    if (!this.page) return job;

    try {
      await this.page.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(randomBetween(1500, 3000));

      const description = await this.page.evaluate(() => {
        const el = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText, [class*="jobDescription"]');
        return el?.textContent?.trim() || '';
      });

      return { ...job, description };
    } catch {
      return job;
    }
  }

  async applyEasyApply(job: IndeedJob, userProfile: {
    name: string;
    email: string;
    phone: string;
    resumePath?: string;
    coverLetter?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.page) return { success: false, message: 'Browser não iniciado' };
    if (!job.isEasyApply) return { success: false, message: 'Vaga não tem Easy Apply' };

    try {
      await this.page.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(randomBetween(2000, 4000));

      // Clica no botão de candidatura
      const applyBtn = await this.page.$('button[id*="apply"], .ia-continueButton, [data-testid="apply-button"]');
      if (!applyBtn) return { success: false, message: 'Botão de candidatura não encontrado' };

      await applyBtn.click();
      await sleep(randomBetween(2000, 3000));

      // Preenche formulário multi-step
      let step = 0;
      const maxSteps = 8;

      while (step < maxSteps) {
        // Verifica se chegou na confirmação
        const confirmed = await this.page.$('[class*="success"], [class*="submitted"], [class*="confirmation"]');
        if (confirmed) {
          logger.info('Indeed application submitted', { job: job.title, company: job.company });
          return { success: true, message: 'Candidatura enviada com sucesso!' };
        }

        // Preenche campos comuns
        await this.fillCommonFields(userProfile);

        // Tenta avançar
        const continueBtn = await this.page.$('.ia-continueButton, button[type="submit"], [data-testid="continue-button"]');
        if (!continueBtn) break;

        await continueBtn.click();
        await sleep(randomBetween(1500, 3000));
        step++;
      }

      return { success: true, message: 'Formulário preenchido' };
    } catch (err: any) {
      logger.error('Indeed apply failed', { err: err.message, job: job.title });
      return { success: false, message: err.message };
    }
  }

  private async fillCommonFields(profile: {
    name: string;
    email: string;
    phone: string;
  }): Promise<void> {
    if (!this.page) return;

    const fields = [
      { selectors: ['input[name*="name"], input[id*="name"]'], value: profile.name },
      { selectors: ['input[type="email"], input[name*="email"]'], value: profile.email },
      { selectors: ['input[type="tel"], input[name*="phone"]'], value: profile.phone },
    ];

    for (const field of fields) {
      for (const selector of field.selectors) {
        const el = await this.page.$(selector);
        if (el) {
          const current = await el.inputValue();
          if (!current) {
            await el.fill(field.value);
            await sleep(randomBetween(300, 800));
          }
          break;
        }
      }
    }

    // Responde perguntas sim/não
    const yesButtons = await this.page.$$('input[type="radio"][value="yes"], input[type="radio"][value="Yes"]');
    for (const btn of yesButtons.slice(0, 3)) {
      await btn.click();
      await sleep(200);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export const indeedConnector = new IndeedConnector();
