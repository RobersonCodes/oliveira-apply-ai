/**
 * We Work Remotely Connector
 * RSS feed oficial categorizado por tipo de trabalho
 */

import axios from 'axios';
import logger from '../../utils/logger';

export interface WWRJob {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  isRemote: boolean;
  description: string;
  applyUrl: string;
  externalId: string;
  postedAt: string;
  daysAgo: number;
  platform: 'WEWORKREMOTELY';
  region?: string;
}

export type WWRCategory =
  | 'programming'
  | 'devops'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'all';

const WWR_FEEDS: Record<WWRCategory, string> = {
  programming: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
  devops: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
  design: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
  product: 'https://weworkremotely.com/categories/remote-product-jobs.rss',
  marketing: 'https://weworkremotely.com/categories/remote-marketing-jobs.rss',
  sales: 'https://weworkremotely.com/categories/remote-sales-jobs.rss',
  all: 'https://weworkremotely.com/remote-jobs.rss',
};

export class WeWorkRemotelyConnector {
  async searchJobs(params: {
    category?: WWRCategory;
    keywords?: string;
    maxResults?: number;
  }): Promise<WWRJob[]> {
    const category = params.category || 'programming';
    const feedUrl = WWR_FEEDS[category];

    try {
      logger.info('WWR RSS fetch', { feedUrl });

      const { data: xml } = await axios.get(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml' },
        timeout: 15000,
      });

      const jobs = this.parseRSS(xml);

      const filtered = params.keywords
        ? jobs.filter(j =>
            j.title.toLowerCase().includes(params.keywords!.toLowerCase()) ||
            j.company.toLowerCase().includes(params.keywords!.toLowerCase()) ||
            j.description.toLowerCase().includes(params.keywords!.toLowerCase()),
          )
        : jobs;

      return filtered.slice(0, params.maxResults || 30);
    } catch (err: any) {
      logger.error('WWR fetch failed', { err: err.message });
      return [];
    }
  }

  private parseRSS(xml: string): WWRJob[] {
    const jobs: WWRJob[] = [];
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    items.forEach((item, i) => {
      const title = this.extractTag(item, 'title');
      const link = this.extractTag(item, 'link');
      const pubDate = this.extractTag(item, 'pubDate');
      const description = this.extractTag(item, 'description');

      // Título formato: "Company Name | Job Title"
      const parts = title.split(' | ');
      const company = parts[0]?.trim() || '';
      const jobTitle = parts[1]?.trim() || title;

      // Extrai região da descrição
      const regionMatch = description.match(/Region:\s*([^<\n]+)/i);
      const region = regionMatch?.[1]?.trim();

      const daysAgo = pubDate ? Math.floor((Date.now() - new Date(pubDate).getTime()) / 86400000) : 0;

      if (!jobTitle || !company) return;

      jobs.push({
        id: String(i),
        externalId: link,
        title: jobTitle,
        company,
        category: 'programming',
        location: region || 'Remote — Worldwide',
        isRemote: true,
        description: description.replace(/<[^>]*>/g, '').slice(0, 500),
        applyUrl: link,
        postedAt: pubDate || new Date().toISOString(),
        daysAgo,
        platform: 'WEWORKREMOTELY',
        region,
      });
    });

    return jobs;
  }

  private extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
  }

  getCategories() {
    return Object.keys(WWR_FEEDS).map(k => ({
      id: k,
      label: {
        programming: '💻 Programação',
        devops: '⚙️ DevOps',
        design: '🎨 Design',
        product: '📦 Produto',
        marketing: '📢 Marketing',
        sales: '💼 Vendas',
        all: '🌐 Todos',
      }[k] || k,
    }));
  }
}

export const weworkremotelyConnector = new WeWorkRemotelyConnector();
