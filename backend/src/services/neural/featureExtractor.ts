/**
 * Feature Extractor
 * Transforma dados brutos de uma vaga em um vetor numérico normalizado
 * que o modelo de ML consegue processar.
 */

export interface JobFeatures {
  // Empresa
  companySize: number        // 0=startup, 0.25=pequena, 0.5=média, 0.75=grande, 1=enterprise
  companyType: number        // 0=startup, 0.5=scaleup, 1=corporação
  hasCompanyRating: number   // 0 ou 1

  // Vaga
  seniorityLevel: number     // 0=intern, 0.25=junior, 0.5=mid, 0.75=senior, 1=lead+
  isRemote: number           // 0=presencial, 0.5=híbrido, 1=remoto
  isEasyApply: number        // 0 ou 1
  jobType: number            // 0=PJ/freelance, 0.5=CLT, 1=tempo integral
  
  // Salário (normalizado por faixa de mercado BR)
  salaryMin: number          // 0-1 normalizado
  salaryMax: number          // 0-1 normalizado
  hasSalary: number          // 0 ou 1

  // Match técnico
  stackMatchScore: number    // 0-1: % das skills da vaga que o usuário tem
  keywordDensity: number     // 0-1: densidade de keywords relevantes
  titleSimilarity: number    // 0-1: similaridade com cargo alvo do usuário

  // Sinal de mercado
  daysOpen: number           // 0=recente, 1=antiga (>30 dias)
  applicantCount: number     // 0=poucos, 1=muitos (normalizado)
  
  // Histórico com empresa
  appliedBefore: number      // 0 ou 1
  rejectedBefore: number     // 0 ou 1
  interviewedBefore: number  // 0 ou 1
  
  // Plataforma
  platform: number           // 0=linkedin, 0.3=indeed, 0.6=gupy, 1=outro
}

const SENIORITY_MAP: Record<string, number> = {
  INTERN: 0, JUNIOR: 0.25, MID: 0.5, SENIOR: 0.75, LEAD: 1, MANAGER: 1, DIRECTOR: 1, EXECUTIVE: 1,
};

const PLATFORM_MAP: Record<string, number> = {
  LINKEDIN: 0, INDEED: 0.3, GLASSDOOR: 0.4, GUPY: 0.6, CATHO: 0.8,
};

const COMPANY_SIZE_MAP: Record<string, number> = {
  STARTUP: 0, SMALL: 0.25, MEDIUM: 0.5, LARGE: 0.75, ENTERPRISE: 1,
};

// Faixas salariais BR para normalização (em R$)
const SALARY_MIN_MARKET = 1500;
const SALARY_MAX_MARKET = 40000;

function normalizeSalary(salary: number): number {
  return Math.min(1, Math.max(0, (salary - SALARY_MIN_MARKET) / (SALARY_MAX_MARKET - SALARY_MIN_MARKET)));
}

function normalizeDays(days: number): number {
  return Math.min(1, days / 30);
}

function normalizeApplicants(count: number): number {
  return Math.min(1, count / 500);
}

export function extractFeatures(job: {
  title: string;
  company: string;
  seniorityLevel?: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  isEasyApply?: boolean;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  platform?: string;
  companySize?: string;
  daysOpen?: number;
  applicantCount?: number;
  detectedSkills?: string[];
  userProfile?: {
    targetRole?: string;
    skills?: string[];
    targetSalary?: number;
  };
  userHistory?: {
    appliedBefore: boolean;
    rejectedBefore: boolean;
    interviewedBefore: boolean;
  };
  companyRating?: number;
}): JobFeatures {
  const userSkills = job.userProfile?.skills || [];
  const jobSkills = job.detectedSkills || [];
  
  // Stack match: quantas skills da vaga o usuário tem
  const stackMatch = jobSkills.length > 0
    ? jobSkills.filter(s => userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()))).length / jobSkills.length
    : 0.5;

  // Title similarity com cargo alvo
  const targetRole = job.userProfile?.targetRole?.toLowerCase() || '';
  const jobTitle = job.title.toLowerCase();
  const commonWords = targetRole.split(' ').filter(w => w.length > 3 && jobTitle.includes(w)).length;
  const titleSim = targetRole ? Math.min(1, commonWords / Math.max(1, targetRole.split(' ').length)) : 0.5;

  // Keyword density (palavras técnicas no título)
  const techKeywords = ['developer', 'engineer', 'dev', 'full', 'stack', 'backend', 'frontend', 'senior', 'pleno', 'junior', 'software'];
  const density = techKeywords.filter(k => jobTitle.includes(k)).length / techKeywords.length;

  return {
    companySize: COMPANY_SIZE_MAP[job.companySize?.toUpperCase() || ''] ?? 0.5,
    companyType: job.companySize === 'STARTUP' ? 0 : job.companySize === 'ENTERPRISE' ? 1 : 0.5,
    hasCompanyRating: job.companyRating ? 1 : 0,

    seniorityLevel: SENIORITY_MAP[job.seniorityLevel?.toUpperCase() || ''] ?? 0.5,
    isRemote: job.isRemote ? 1 : job.isHybrid ? 0.5 : 0,
    isEasyApply: job.isEasyApply ? 1 : 0,
    jobType: job.jobType === 'FULL_TIME' ? 1 : job.jobType === 'CONTRACT' ? 0.5 : 0,

    salaryMin: job.salaryMin ? normalizeSalary(job.salaryMin) : 0,
    salaryMax: job.salaryMax ? normalizeSalary(job.salaryMax) : 0,
    hasSalary: (job.salaryMin || job.salaryMax) ? 1 : 0,

    stackMatchScore: stackMatch,
    keywordDensity: density,
    titleSimilarity: titleSim,

    daysOpen: normalizeDays(job.daysOpen || 0),
    applicantCount: normalizeApplicants(job.applicantCount || 0),

    appliedBefore: job.userHistory?.appliedBefore ? 1 : 0,
    rejectedBefore: job.userHistory?.rejectedBefore ? 1 : 0,
    interviewedBefore: job.userHistory?.interviewedBefore ? 1 : 0,

    platform: PLATFORM_MAP[job.platform?.toUpperCase() || ''] ?? 0.5,
  };
}

export function featuresToVector(features: JobFeatures): number[] {
  return [
    features.companySize,
    features.companyType,
    features.hasCompanyRating,
    features.seniorityLevel,
    features.isRemote,
    features.isEasyApply,
    features.jobType,
    features.salaryMin,
    features.salaryMax,
    features.hasSalary,
    features.stackMatchScore,
    features.keywordDensity,
    features.titleSimilarity,
    features.daysOpen,
    features.applicantCount,
    features.appliedBefore,
    features.rejectedBefore,
    features.interviewedBefore,
    features.platform,
  ];
}

export const FEATURE_NAMES = [
  'companySize', 'companyType', 'hasCompanyRating',
  'seniorityLevel', 'isRemote', 'isEasyApply', 'jobType',
  'salaryMin', 'salaryMax', 'hasSalary',
  'stackMatchScore', 'keywordDensity', 'titleSimilarity',
  'daysOpen', 'applicantCount',
  'appliedBefore', 'rejectedBefore', 'interviewedBefore',
  'platform',
];

export const FEATURE_DIMENSIONS = FEATURE_NAMES.length; // 19
