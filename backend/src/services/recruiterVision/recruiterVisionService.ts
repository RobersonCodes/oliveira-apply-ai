import { detectATS, ATSProfile } from './atsDetector';
import { optimizeForATS, calculateATSScore, OptimizationResult, ATSScoreBreakdown } from './resumeOptimizer';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export const recruiterVisionService = {

  async analyze(params: {
    userId: string;
    resumeContent: string;
    jobDescription: string;
    jobTitle: string;
    company: string;
    applyUrl?: string;
  }): Promise<{
    atsProfile: ATSProfile;
    scoreBreakdown: ATSScoreBreakdown;
    optimization: OptimizationResult;
  }> {
    const { userId, resumeContent, jobDescription, company, applyUrl } = params;

    // 1. Detecta o ATS
    const atsProfile = detectATS({ applyUrl, companyName: company, jobTitle: params.jobTitle });
    logger.info('ATS detected', { company, system: atsProfile.system, confidence: atsProfile.confidence });

    // 2. Busca skills do usuário
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const userSkills = (profile?.skills as string[]) || [];

    // 3. Score atual
    const scoreBreakdown = calculateATSScore(resumeContent, jobDescription, atsProfile);

    // 4. Otimiza para o ATS específico
    const optimization = await optimizeForATS(resumeContent, jobDescription, atsProfile, userSkills);

    return { atsProfile, scoreBreakdown, optimization };
  },

  async detectOnly(company: string, applyUrl?: string): Promise<ATSProfile> {
    return detectATS({ companyName: company, applyUrl });
  },

  async scoreOnly(params: {
    resumeContent: string;
    jobDescription: string;
    company: string;
    applyUrl?: string;
  }): Promise<{ atsProfile: ATSProfile; scoreBreakdown: ATSScoreBreakdown }> {
    const atsProfile = detectATS({ companyName: params.company, applyUrl: params.applyUrl });
    const scoreBreakdown = calculateATSScore(params.resumeContent, params.jobDescription, atsProfile);
    return { atsProfile, scoreBreakdown };
  },

  getSupportedATS() {
    return [
      { system: 'greenhouse', name: 'Greenhouse', marketShare: '25%', companies: 'Nubank, iFood, Loft, Creditas' },
      { system: 'lever', name: 'Lever', marketShare: '15%', companies: 'Stone, C6 Bank, CI&T' },
      { system: 'workday', name: 'Workday', marketShare: '20%', companies: 'Mercado Livre, Itaú, Santander, Google' },
      { system: 'gupy', name: 'Gupy', marketShare: '18%', companies: 'Magazine Luiza, PagBank, Inter, TOTVS' },
      { system: 'linkedin', name: 'LinkedIn Easy Apply', marketShare: '100%', companies: 'Todas no LinkedIn' },
      { system: 'taleo', name: 'Oracle Taleo', marketShare: '8%', companies: 'Bradesco, grandes corporações' },
      { system: 'icims', name: 'iCIMS', marketShare: '5%', companies: 'Amazon Brasil' },
      { system: 'breezy', name: 'Breezy HR', marketShare: '3%', companies: 'Startups em geral' },
      { system: 'bamboohr', name: 'BambooHR', marketShare: '3%', companies: 'PMEs tech' },
      { system: 'recruitee', name: 'Recruitee', marketShare: '2%', companies: 'ContaAzul, agências' },
      { system: 'smartrecruiters', name: 'SmartRecruiters', marketShare: '1%', companies: 'Multinacionais' },
    ];
  },
};
