import axios from 'axios';

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  source: 'indeed' | 'infojobs' | 'linkedin';
  postedAt?: string;
  jobType?: string;
}

// Indeed via SerpAPI (free tier: 100 searches/month)
async function searchIndeed(query: string, location: string, limit = 10): Promise<JobResult[]> {
  const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
  console.log('[jobSearch] SERPAPI_KEY present:', !!SERPAPI_KEY);
  if (!SERPAPI_KEY) {
    // Fallback: scrape Indeed directly
    return scrapeIndeed(query, location, limit);
  }

  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'indeed',
        q: query,
        l: location || 'Brasil',
        api_key: SERPAPI_KEY,
        num: limit,
        hl: 'pt',
        gl: 'br',
      },
      timeout: 10000,
    });

    return (data.jobs_results || []).slice(0, limit).map((job: any, i: number) => ({
      id: `indeed-${i}-${Date.now()}`,
      title: job.title || '',
      company: job.company_name || '',
      location: job.location || location,
      salary: job.salary || undefined,
      description: job.description || job.snippet || '',
      url: job.link || `https://br.indeed.com/jobs?q=${encodeURIComponent(query)}`,
      source: 'indeed' as const,
      postedAt: job.date || undefined,
      jobType: job.job_type || undefined,
    }));
  } catch {
    return scrapeIndeed(query, location, limit);
  }
}

// Indeed scraping fallback (without API key)
async function scrapeIndeed(query: string, location: string, limit: number): Promise<JobResult[]> {
  // Always return at least a direct search link
  const searchUrl = `https://br.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location || '')}`;
  
  const fallback: JobResult[] = [{
    id: `indeed-link-${Date.now()}`,
    title: `Ver vagas de "${query}" no Indeed`,
    company: 'Indeed Brasil',
    location: location || 'Brasil',
    description: `Clique em "Ver vaga" para buscar diretamente no Indeed Brasil. Mostrará todas as vagas disponíveis para "${query}"${location ? ` em ${location}` : ''}.`,
    url: searchUrl,
    source: 'indeed',
    postedAt: 'Agora',
  }];

  try {
    const { data } = await axios.get(`https://br.indeed.com/jobs`, {
      params: { q: query, l: location || '' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Accept': 'text/html',
      },
      timeout: 6000,
    });

    const jobs: JobResult[] = [];
    // Try to extract job IDs from HTML
    const idMatches = [...data.matchAll(/data-jk="([a-z0-9]+)"/g)];
    const titleMatches = [...data.matchAll(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/g)];
    const companyMatches = [...data.matchAll(/data-testid="company-name"[^>]*>([^<]+)<\/span>/g)];

    idMatches.slice(0, limit).forEach((m, i) => {
      jobs.push({
        id: `indeed-${m[1]}`,
        title: titleMatches[i]?.[1]?.trim() || `Vaga ${query} #${i + 1}`,
        company: companyMatches[i]?.[1]?.trim() || 'Empresa não informada',
        location: location || 'Brasil',
        description: '',
        url: `https://br.indeed.com/viewjob?jk=${m[1]}`,
        source: 'indeed',
      });
    });

    return jobs.length > 0 ? jobs : fallback;
  } catch {
    return fallback;
  }
}

// InfoJobs via API pública
async function searchInfojobs(query: string, location: string, limit = 10): Promise<JobResult[]> {
  try {
    const { data } = await axios.get('https://api.infojobs.com.br/api/7/offer', {
      params: {
        q: query,
        city: location || '',
        maxResults: limit,
        country: 'br',
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.INFOJOBS_CLIENT_ID || ''}:${process.env.INFOJOBS_CLIENT_SECRET || ''}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    return (data.items || []).slice(0, limit).map((job: any) => ({
      id: `infojobs-${job.id}`,
      title: job.title || '',
      company: job.author?.name || 'Empresa não informada',
      location: job.city || location || 'Brasil',
      salary: job.salaryDescription || undefined,
      description: job.requirementMin || job.description || '',
      url: job.link || `https://www.infojobs.com.br/vagas-de-emprego-em-${encodeURIComponent(query)}.aspx`,
      source: 'infojobs' as const,
      postedAt: job.updated || undefined,
      jobType: job.contractType?.value || undefined,
    }));
  } catch {
    // InfoJobs API might need credentials — return link to search
    return [{
      id: `infojobs-${Date.now()}`,
      title: `Vagas de ${query}`,
      company: 'Ver no InfoJobs',
      location: location || 'Brasil',
      description: `Busque "${query}" diretamente no InfoJobs Brasil`,
      url: `https://www.infojobs.com.br/vagas-de-emprego-em-${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}.aspx`,
      source: 'infojobs',
    }];
  }
}

export const jobSearchService = {
  async search(query: string, location: string, sources: string[], limit = 10): Promise<JobResult[]> {
    const promises: Promise<JobResult[]>[] = [];

    if (sources.includes('indeed')) promises.push(searchIndeed(query, location, limit));
    if (sources.includes('infojobs')) promises.push(searchInfojobs(query, location, limit));

    const results = await Promise.allSettled(promises);
    const jobs: JobResult[] = [];

    results.forEach(r => {
      if (r.status === 'fulfilled') jobs.push(...r.value);
    });

    // Sort by source variety
    return jobs.slice(0, limit * sources.length);
  },
};
