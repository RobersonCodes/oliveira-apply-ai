/**
 * GeekHunter Connector
 * 
 * GeekHunter tem API pública não-oficial acessível via headers normais.
 * Fluxo:
 * 1. Busca vagas via API REST
 * 2. Filtra por skills, nível, remoto, salário
 * 3. Score Neural em cada vaga
 * 4. Candidatura via Playwright (cria perfil ou usa existente)
 */

import axios from 'axios';
import { Browser, Page, chromium } from 'playwright';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface GeekHunterJob {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
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
  platform: 'GEEKHUNTER';
  benefits?: string[];
  companySize?: string;
  companySegment?: string;
}

export interface GeekHunterSearchParams {
  keywords?: string;
  skills?: string[];
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  seniorityLevels?: string[];
  jobTypes?: string[];
  maxResults?: number;
  page?: number;
}

const GEEKHUNTER_API = 'https://api.geekhunter.com.br';
const GEEKHUNTER_BASE = 'https://www.geekhunter.com.br';

const SENIORITY_MAP: Record<string, string> = {
  INTERN: 'trainee',
  JUNIOR: 'junior',
  MID: 'pleno',
  SENIOR: 'senior',
  LEAD: 'especialista',
};

function parseDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export class GeekHunterConnector {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://www.geekhunter.com.br',
    'Referer': 'https://www.geekhunter.com.br/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async searchJobs(params: GeekHunterSearchParams): Promise<GeekHunterJob[]> {
    try {
      const queryParams: Record<string, any> = {
        page: params.page || 1,
        per_page: Math.min(params.maxResults || 20, 50),
      };

      if (params.keywords) queryParams.q = params.keywords;
      if (params.location) queryParams.city = params.location;
      if (params.remoteOnly) queryParams.remote = true;
      if (params.salaryMin) queryParams.salary_min = params.salaryMin;
      if (params.skills?.length) queryParams.skills = params.skills.join(',');
      if (params.seniorityLevels?.length) {
        queryParams.seniority = params.seniorityLevels
          .map(s => SENIORITY_MAP[s] || s.toLowerCase())
          .join(',');
      }

      logger.info('GeekHunter API search', { queryParams });

      const response = await axios.get(`${GEEKHUNTER_API}/v3/jobs`, {
        params: queryParams,
        headers: this.headers,
        timeout: 15000,
      });

      const data = response.data;
      const jobs = data.jobs || data.results || data || [];

      return jobs.map((job: any) => this.mapJob(job));
    } catch (err: any) {
      logger.warn('GeekHunter API failed, trying scraper', { err: err.message });
      return this.scrapeJobs(params);
    }
  }

  private mapJob(job: any): GeekHunterJob {
    return {
      id: job.id,
      externalId: String(job.id),
      title: job.title || job.name || '',
      company: job.company?.name || job.company || '',
      companyLogo: job.company?.logo_url || job.logo,
      location: job.city || job.location || 'Brasil',
      isRemote: job.remote || job.is_remote || false,
      salaryMin: job.salary_min || job.min_salary,
      salaryMax: job.salary_max || job.max_salary,
      description: job.description || job.summary || '',
      skills: job.skills?.map((s: any) => s.name || s) || [],
      seniorityLevel: job.seniority || job.seniority_level || 'MID',
      jobType: job.job_type || job.contract_type || 'FULL_TIME',
      applyUrl: `${GEEKHUNTER_BASE}/vagas/${job.id || job.slug}`,
      postedAt: job.created_at || job.published_at || new Date().toISOString(),
      daysAgo: parseDaysAgo(job.created_at || job.published_at || new Date().toISOString()),
      platform: 'GEEKHUNTER',
      benefits: job.benefits?.map((b: any) => b.name || b) || [],
      companySize: job.company?.size || '',
      companySegment: job.company?.segment || '',
    };
  }

  private async scrapeJobs(params: GeekHunterSearchParams): Promise<GeekHunterJob[]> {
    if (!this.browser) await this.initBrowser();
    if (!this.page) return [];

    const url = this.buildScrapeUrl(params);
    logger.info('GeekHunter scraping', { url });

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randomBetween(2000, 4000));

    return await this.page.evaluate(() => {
      const jobs: any[] = [];
      const cards = document.querySelectorAll('[class*="job-card"], [class*="JobCard"], article[class*="job"]');

      cards.forEach(card => {
        try {
          const title = card.querySelector('h2, h3, [class*="title"]')?.textContent?.trim();
          const company = card.querySelector('[class*="company"]')?.textContent?.trim();
          const location = card.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim();
          const salary = card.querySelector('[class*="salary"]')?.textContent?.trim();
          const link = card.querySelector('a')?.href;
          const isRemote = card.textContent?.toLowerCase().includes('remoto') || false;
          const skills = Array.from(card.querySelectorAll('[class*="skill"], [class*="tag"]'))
            .map(el => el.textContent?.trim())
            .filter(Boolean);

          if (!title || !company) return;

          jobs.push({
            id: Math.random(),
            externalId: link?.split('/').pop() || '',
            title,
            company,
            location: location || 'Brasil',
            isRemote,
            description: '',
            skills,
            seniorityLevel: 'MID',
            jobType: 'FULL_TIME',
            applyUrl: link || '',
            postedAt: new Date().toISOString(),
            daysAgo: 0,
            platform: 'GEEKHUNTER',
          });
        } catch { /* skip */ }
      });

      return jobs;
    });
  }

  private buildScrapeUrl(params: GeekHunterSearchParams): string {
    const url = new URL(`${GEEKHUNTER_BASE}/vagas`);
    if (params.keywords) url.searchParams.set('q', params.keywords);
    if (params.remoteOnly) url.searchParams.set('remote', 'true');
    if (params.location) url.searchParams.set('city', params.location);
    return url.toString();
  }

  async getJobDetails(jobId: string): Promise<Partial<GeekHunterJob>> {
    try {
      const response = await axios.get(`${GEEKHUNTER_API}/v3/jobs/${jobId}`, {
        headers: this.headers,
        timeout: 10000,
      });
      return this.mapJob(response.data);
    } catch {
      return {};
    }
  }

  async initBrowser(headless = true): Promise<void> {
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

  async applyToJob(job: GeekHunterJob, userProfile: {
    name: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    resumePath?: string;
    coverLetter?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.browser) await this.initBrowser(true);
    if (!this.page) return { success: false, message: 'Browser não iniciado' };

    try {
      await this.page.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(randomBetween(2000, 3000));

      // Verifica se precisa login
      const loginBtn = await this.page.$('button[class*="login"], a[href*="login"]');
      if (loginBtn) {
        return { success: false, message: 'GeekHunter requer login — configure suas credenciais' };
      }

      // Clica em candidatar-se
      const applyBtn = await this.page.$('button[class*="apply"], button[class*="candidat"]');
      if (!applyBtn) {
        return { success: false, message: 'Botão de candidatura não encontrado' };
      }

      await applyBtn.click();
      await sleep(randomBetween(1500, 2500));

      // Preenche cover letter se tiver modal
      if (userProfile.coverLetter) {
        const textarea = await this.page.$('textarea[name*="cover"], textarea[name*="message"]');
        if (textarea) {
          await textarea.fill(userProfile.coverLetter);
          await sleep(randomBetween(500, 1000));
        }
      }

      // Submete
      const submitBtn = await this.page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(randomBetween(2000, 3000));
      }

      logger.info('GeekHunter application submitted', { job: job.title });
      return { success: true, message: 'Candidatura enviada!' };
    } catch (err: any) {
      return { success: false, message: err.message };
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

export const geekHunterConnector = new GeekHunterConnector();
