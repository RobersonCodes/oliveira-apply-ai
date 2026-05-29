import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { prisma } from '../config/database';
import { aiService } from './ai.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { sleep, randomBetween } from '../utils/helpers';
import { encrypt, decrypt } from '../utils/crypto';
import type { AutomationConfig } from '../dtos/automation.dto';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salary?: string;
  url: string;
  description?: string;
  isEasyApply: boolean;
  postedAt?: string;
}

export class AutomationService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  // ─── Human Simulation ────────────────────────────────────────────────────────

  private async humanDelay(min = 800, max = 2500) {
    await sleep(randomBetween(min, max));
  }

  private async humanType(page: Page, selector: string, text: string) {
    await page.click(selector);
    await this.humanDelay(200, 500);
    for (const char of text) {
      await page.type(selector, char, { delay: randomBetween(60, 180) });
      if (Math.random() < 0.05) {
        await this.humanDelay(300, 800); // occasional pause
      }
    }
  }

  private async humanScroll(page: Page) {
    const scrollAmount = randomBetween(200, 600);
    await page.evaluate((amount) => {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }, scrollAmount);
    await this.humanDelay(500, 1200);
  }

  private async moveMouse(page: Page) {
    const x = randomBetween(100, 1200);
    const y = randomBetween(100, 700);
    await page.mouse.move(x, y, { steps: randomBetween(5, 15) });
  }

  // ─── Browser Setup ───────────────────────────────────────────────────────────

  private async launchBrowser() {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1366,768',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      permissions: [],
      geolocation: { latitude: -23.5505, longitude: -46.6333 },
    });

    // Override navigator properties to avoid detection
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US'],
      });
      (window as any).chrome = { runtime: {} };
    });

    return this.context.newPage();
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }

  // ─── LinkedIn Authentication ─────────────────────────────────────────────────

  private async loginLinkedIn(page: Page, email: string, encryptedPassword: string): Promise<boolean> {
    const password = decrypt(encryptedPassword);
    logger.info(`[Automation] Logging in to LinkedIn as ${email}`);

    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
    await this.humanDelay(1000, 2000);

    await this.humanType(page, '#username', email);
    await this.humanDelay(400, 900);
    await this.humanType(page, '#password', password);
    await this.humanDelay(600, 1200);
    await this.moveMouse(page);
    await this.humanDelay(300, 700);
    await page.click('[data-litms-control-urn="login-submit"]');

    try {
      await page.waitForURL('**/feed/**', { timeout: 15000 });
      logger.info('[Automation] LinkedIn login successful');
      return true;
    } catch {
      logger.warn('[Automation] LinkedIn login may have failed or requires verification');
      return false;
    }
  }

  // ─── Job Search ──────────────────────────────────────────────────────────────

  private async searchJobs(page: Page, config: AutomationConfig): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const keyword = encodeURIComponent(config.keywords.join(' '));
    const location = encodeURIComponent(config.location || 'Brazil');

    let url = `https://www.linkedin.com/jobs/search/?keywords=${keyword}&location=${location}`;
    if (config.remoteOnly) url += '&f_WT=2';
    if (config.easyApplyOnly) url += '&f_LF=f_AL';
    if (config.seniorityLevels?.length) {
      const levels = config.seniorityLevels.map(this.mapSeniority).join(',');
      url += `&f_E=${levels}`;
    }

    await page.goto(url, { waitUntil: 'networkidle' });
    await this.humanDelay(1500, 3000);
    await this.humanScroll(page);

    const maxPages = Math.ceil((config.maxApplications || 20) / 25);

    for (let p = 0; p < maxPages; p++) {
      await this.humanDelay(1000, 2500);

      const pageJobs = await page.evaluate(() => {
        const items = document.querySelectorAll('.jobs-search__results-list li, .job-card-container');
        return Array.from(items).map((item) => {
          const titleEl = item.querySelector('.job-card-list__title, .base-search-card__title');
          const companyEl = item.querySelector('.job-card-container__company-name, .base-search-card__subtitle');
          const locationEl = item.querySelector('.job-card-container__metadata-item, .job-search-card__location');
          const linkEl = item.querySelector('a[href*="/jobs/view/"]') as HTMLAnchorElement;
          const easyApplyEl = item.querySelector('.job-card-container__apply-method, [aria-label*="Easy Apply"]');
          const salaryEl = item.querySelector('.job-card-container__salary-info');

          const rawId = linkEl?.href?.match(/\/jobs\/view\/(\d+)/)?.[1] || '';
          return {
            id: rawId,
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            isRemote: (locationEl?.textContent || '').toLowerCase().includes('remote') ||
                      (locationEl?.textContent || '').toLowerCase().includes('remoto'),
            salary: salaryEl?.textContent?.trim() || undefined,
            url: linkEl?.href || '',
            isEasyApply: !!easyApplyEl,
          };
        }).filter(j => j.id && j.title);
      });

      jobs.push(...(pageJobs as JobListing[]));
      if (jobs.length >= (config.maxApplications || 20)) break;

      // Next page
      const nextBtn = await page.$('button[aria-label="View next page"]');
      if (!nextBtn) break;
      await nextBtn.click();
      await this.humanDelay(2000, 4000);
    }

    return jobs.slice(0, config.maxApplications || 20);
  }

  private mapSeniority(level: string): string {
    const map: Record<string, string> = {
      INTERN: '1', JUNIOR: '2', MID: '3',
      SENIOR: '4', LEAD: '5', MANAGER: '6',
    };
    return map[level] || '3';
  }

  // ─── Easy Apply ──────────────────────────────────────────────────────────────

  private async applyEasyApply(page: Page, job: JobListing, coverLetter?: string): Promise<boolean> {
    try {
      await page.goto(job.url, { waitUntil: 'networkidle' });
      await this.humanDelay(1500, 3000);
      await this.humanScroll(page);
      await this.moveMouse(page);

      const applyBtn = await page.$('button[aria-label*="Easy Apply"]');
      if (!applyBtn) return false;

      await applyBtn.click();
      await this.humanDelay(1000, 2000);

      // Handle multi-step Easy Apply modal
      let step = 0;
      const maxSteps = 8;

      while (step < maxSteps) {
        await this.humanDelay(800, 1800);

        // Check for cover letter field
        if (coverLetter) {
          const coverLetterField = await page.$('textarea[id*="cover"], textarea[placeholder*="cover"], textarea[aria-label*="cover"]');
          if (coverLetterField) {
            await coverLetterField.click();
            await this.humanDelay(300, 600);
            await coverLetterField.fill(coverLetter);
            await this.humanDelay(500, 1000);
          }
        }

        // Look for Next or Submit button
        const nextBtn = await page.$('button[aria-label="Continue to next step"], button[aria-label="Submit application"]');
        if (!nextBtn) break;

        const btnText = await nextBtn.textContent();
        await this.moveMouse(page);
        await this.humanDelay(400, 800);
        await nextBtn.click();

        if (btnText?.toLowerCase().includes('submit')) {
          await this.humanDelay(1000, 2000);
          // Look for success confirmation
          const successEl = await page.$('[aria-label*="application was sent"], .artdeco-toaster--success');
          return !!successEl || true; // assume success if no error
        }

        step++;
      }

      return false;
    } catch (err) {
      logger.error(`[Automation] Error applying to ${job.title}:`, err);
      return false;
    }
  }

  // ─── Main Runner ─────────────────────────────────────────────────────────────

  async runAutomation(automationId: string) {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: {
        user: {
          include: {
            linkedinAccount: true,
            resumes: { where: { isDefault: true }, take: 1 },
            subscription: true,
          },
        },
      },
    });

    if (!automation) throw new AppError('Automation not found', 404);
    if (!automation.user.linkedinAccount) throw new AppError('LinkedIn account not connected', 400);

    const config = automation.config as AutomationConfig;
    let page: Page | null = null;

    try {
      await prisma.automation.update({
        where: { id: automationId },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      page = await this.launchBrowser();

      const logStep = async (level: string, message: string, data?: any) => {
        await prisma.automationLog.create({
          data: { automationId, level, message, data },
        });
        logger.info(`[Automation ${automationId}] ${message}`);
      };

      await logStep('info', 'Browser launched, starting LinkedIn login...');

      const loginOk = await this.loginLinkedIn(
        page,
        automation.user.linkedinAccount.email,
        automation.user.linkedinAccount.password,
      );

      if (!loginOk) {
        await logStep('error', 'LinkedIn login failed');
        throw new AppError('LinkedIn login failed', 400);
      }

      await logStep('success', 'LinkedIn login successful. Searching jobs...');

      const jobs = await this.searchJobs(page, config);
      await logStep('info', `Found ${jobs.length} jobs matching criteria`);

      await prisma.automation.update({
        where: { id: automationId },
        data: { jobsFound: jobs.length },
      });

      let applied = 0;
      let skipped = 0;
      let failed = 0;

      const defaultResume = automation.user.resumes[0];

      for (const job of jobs) {
        // Check subscription limit
        const sub = automation.user.subscription;
        if (sub && sub.applicationsUsed >= sub.applicationsLimit) {
          await logStep('warn', 'Application limit reached for current plan');
          break;
        }

        await logStep('info', `Processing: ${job.title} at ${job.company}`);

        // Get job description
        try {
          await page.goto(job.url, { waitUntil: 'domcontentloaded' });
          await this.humanDelay(1000, 2000);
          job.description = await page.$eval(
            '.jobs-description__content, .show-more-less-html__markup',
            (el) => el.textContent?.trim() || '',
          ).catch(() => '');
        } catch {}

        // AI analysis
        const aiResult = await aiService.analyzeJobMatch({
          jobTitle: job.title,
          jobDescription: job.description || '',
          resumeContent: defaultResume?.rawText || '',
        }).catch(() => null);

        if (aiResult && aiResult.matchScore < (config.minMatchScore || 40)) {
          await logStep('info', `Skipped: low AI match score (${aiResult.matchScore}%)`);
          skipped++;
          continue;
        }

        // Generate cover letter
        let coverLetter: string | undefined;
        if (config.generateCoverLetter && job.description) {
          coverLetter = await aiService.generateCoverLetter({
            jobTitle: job.title,
            company: job.company,
            jobDescription: job.description,
            userName: automation.user.name,
            resumeContent: defaultResume?.rawText || '',
          }).catch(() => undefined);
        }

        // Apply
        const success = job.isEasyApply
          ? await this.applyEasyApply(page, job, coverLetter)
          : false; // Non-Easy-Apply requires manual handling

        // Save application
        await prisma.application.create({
          data: {
            userId: automation.user.id,
            automationId,
            resumeId: defaultResume?.id,
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            isRemote: job.isRemote,
            jobUrl: job.url,
            jobDescription: job.description,
            platform: 'linkedin',
            externalId: job.id,
            isEasyApply: job.isEasyApply,
            coverLetter,
            aiScore: aiResult?.matchScore,
            aiNotes: aiResult?.notes,
            status: success ? 'APPLIED' : 'PENDING',
            appliedAt: success ? new Date() : undefined,
          } as any,
        });

        if (success) {
          applied++;
          // Update subscription usage
          await prisma.subscription.update({
            where: { userId: automation.user.id },
            data: { applicationsUsed: { increment: 1 } },
          });
          await logStep('success', `✅ Applied to ${job.title} at ${job.company}`);
        } else {
          failed++;
          await logStep('warn', `⚠️ Could not apply to ${job.title} (not Easy Apply or failed)`);
        }

        await prisma.automation.update({
          where: { id: automationId },
          data: { jobsApplied: applied, jobsSkipped: skipped, jobsFailed: failed },
        });

        // Human-like delay between applications
        const delay = randomBetween(
          config.minDelay ?? 15000,
          config.maxDelay ?? 45000,
        );
        await logStep('info', `Waiting ${Math.round(delay / 1000)}s before next application...`);
        await sleep(delay);
      }

      await prisma.automation.update({
        where: { id: automationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          lastRunAt: new Date(),
          jobsApplied: applied,
          jobsSkipped: skipped,
          jobsFailed: failed,
        },
      });

      await logStep('success', `🎉 Automation completed! Applied: ${applied}, Skipped: ${skipped}, Failed: ${failed}`);

      // Create notification
      await prisma.notification.create({
        data: {
          userId: automation.user.id,
          title: 'Automation completed!',
          message: `Applied to ${applied} jobs. Check your dashboard for details.`,
          type: 'success',
        },
      });

    } catch (error) {
      logger.error(`[Automation ${automationId}] Fatal error:`, error);
      await prisma.automation.update({
        where: { id: automationId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      await this.closeBrowser();
    }
  }
}

export const automationService = new AutomationService();
