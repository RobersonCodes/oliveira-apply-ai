// v2 - JSearch RapidAPI
// src/services/jobSearch.service.ts
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

// â”€â”€â”€ JSearch (RapidAPI) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cobre Indeed, LinkedIn, Glassdoor e outros em uma sÃ³ chamada
// Plano gratuito: 200 requests/mÃªs

async function searchJSearch(query: string, location: string, limit = 10): Promise<JobResult[]> {
  const JSEARCH_KEY = process.env.JSEARCH_API_KEY || '';
  if (!JSEARCH_KEY) {
    console.warn('[jobSearch] JSEARCH_API_KEY not set â€” using fallback');
    return fallbackResults(query, location);
  }

  try {
    const searchQuery = location
      ? `${query} in ${location}`
      : `${query} in Brazil`;

    const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: searchQuery,
        page: '1',
        num_pages: '1',
        country: 'br',
        language: 'pt',
        date_posted: 'month',
      },
      headers: {
        'X-RapidAPI-Key': JSEARCH_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      timeout: 12000,
    });

    const jobs = (data.data || []).slice(0, limit);

    return jobs.map((job: any, i: number) => {
      // Determinar source pelo employer_website ou apply_link
      let source: 'indeed' | 'infojobs' | 'linkedin' = 'indeed';
      const applyLink = (job.job_apply_link || '').toLowerCase();
      if (applyLink.includes('linkedin')) source = 'linkedin';
      else if (applyLink.includes('infojobs')) source = 'infojobs';

      // Formatar salÃ¡rio
      let salary: string | undefined;
      if (job.job_min_salary && job.job_max_salary) {
        const currency = job.job_salary_currency || 'BRL';
        salary = `${currency} ${Number(job.job_min_salary).toLocaleString('pt-BR')} â€“ ${Number(job.job_max_salary).toLocaleString('pt-BR')}`;
      }

      // Formatar data
      let postedAt: string | undefined;
      if (job.job_posted_at_datetime_utc) {
        const date = new Date(job.job_posted_at_datetime_utc);
        const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
        postedAt = diff === 0 ? 'Hoje' : diff === 1 ? 'Ontem' : `${diff} dias atrÃ¡s`;
      }

      return {
        id: job.job_id || `jsearch-${i}-${Date.now()}`,
        title: job.job_title || '',
        company: job.employer_name || 'Empresa nÃ£o informada',
        location: job.job_city
          ? `${job.job_city}${job.job_state ? `, ${job.job_state}` : ''}`
          : location || 'Brasil',
        salary,
        description: job.job_description
          ? job.job_description.slice(0, 300)
          : '',
        url: job.job_apply_link || job.job_google_link || '#',
        source,
        postedAt,
        jobType: job.job_employment_type || undefined,
      };
    });
  } catch (err: any) {
    console.error('[jobSearch] JSearch error:', err?.response?.data || err?.message);
    return fallbackResults(query, location);
  }
}

// â”€â”€â”€ Fallback quando nÃ£o hÃ¡ API key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fallbackResults(query: string, location: string): JobResult[] {
  return [
    {
      id: `indeed-fallback-${Date.now()}`,
      title: `Ver vagas de "${query}" no Indeed`,
      company: 'Indeed Brasil',
      location: location || 'Brasil',
      description: `Clique em "Ver vaga" para buscar diretamente no Indeed Brasil.`,
      url: `https://br.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location || '')}`,
      source: 'indeed',
      postedAt: 'Agora',
    },
    {
      id: `infojobs-fallback-${Date.now()}`,
      title: `Vagas de ${query}`,
      company: 'Ver no InfoJobs',
      location: location || 'Brasil',
      description: `Busque "${query}" diretamente no InfoJobs Brasil`,
      url: `https://www.infojobs.com.br/vagas-de-emprego-em-${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}.aspx`,
      source: 'infojobs',
    },
  ];
}

// â”€â”€â”€ Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const jobSearchService = {
  async search(query: string, location: string, sources: string[], limit = 10): Promise<JobResult[]> {
    // JSearch cobre indeed + linkedin + outros em uma chamada sÃ³
    // sources Ã© mantido para compatibilidade com o frontend mas JSearch busca em todos
    const jobs = await searchJSearch(query, location, limit);

    // Filtrar por source se especificado (linkedin nÃ£o Ã© suportado pelo frontend ainda)
    if (sources.length > 0 && !sources.includes('indeed') && !sources.includes('infojobs')) {
      return jobs;
    }

    return jobs;
  },
};
