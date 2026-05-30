/**
 * Recruiter Vision — ATS Detector
 * 
 * Identifica qual sistema ATS a empresa usa baseado em:
 * - Domínio da URL de candidatura
 * - Padrões conhecidos de cada ATS
 * - Dados públicos de ferramentas de RH
 */

export type ATSSystem =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'gupy'
  | 'catho'
  | 'linkedin'
  | 'indeed'
  | 'taleo'
  | 'icims'
  | 'breezy'
  | 'bamboohr'
  | 'recruitee'
  | 'smartrecruiters'
  | 'aplysia'
  | 'unknown';

export interface ATSProfile {
  system: ATSSystem;
  name: string;
  confidence: number; // 0-1
  rules: ATSOptimizationRules;
  detectionSource: string;
}

export interface ATSOptimizationRules {
  // Formatação
  preferSimpleFormatting: boolean;
  avoidTables: boolean;
  avoidColumns: boolean;
  avoidHeaders: boolean;
  avoidImages: boolean;
  avoidGraphics: boolean;

  // Parsing
  parsesLinkedInUrls: boolean;
  parsesGithubUrls: boolean;
  requiresStandardSections: boolean;

  // Keywords
  keywordMatchingAlgorithm: 'exact' | 'fuzzy' | 'semantic';
  weightsTitleHighly: boolean;
  weightsFirstPageHighly: boolean;
  maxResumePages: number;

  // Campos específicos
  requiresSeparateDateFormat: boolean;
  preferredDateFormat: string;
  requiresPhoneFormat: string;

  // Dicas específicas
  tips: string[];
  warnings: string[];
  scoringFactors: Array<{ factor: string; weight: number; description: string }>;
}

// Base de conhecimento dos principais ATS
const ATS_PROFILES: Record<ATSSystem, Omit<ATSProfile, 'confidence' | 'detectionSource'>> = {
  greenhouse: {
    system: 'greenhouse',
    name: 'Greenhouse',
    rules: {
      preferSimpleFormatting: true,
      avoidTables: true,
      avoidColumns: true,
      avoidHeaders: false,
      avoidImages: true,
      avoidGraphics: true,
      parsesLinkedInUrls: true,
      parsesGithubUrls: true,
      requiresStandardSections: true,
      keywordMatchingAlgorithm: 'fuzzy',
      weightsTitleHighly: true,
      weightsFirstPageHighly: true,
      maxResumePages: 2,
      requiresSeparateDateFormat: false,
      preferredDateFormat: 'MM/YYYY',
      requiresPhoneFormat: '+55 (11) 99999-9999',
      tips: [
        'Use seções padrão: Experiência, Educação, Habilidades',
        'Inclua palavras-chave exatas do anúncio',
        'GitHub e LinkedIn são parseados automaticamente',
        'Bullet points simples funcionam melhor que parágrafos',
        'Mantenha máximo 2 páginas',
      ],
      warnings: [
        'Tabelas quebram o parsing do Greenhouse',
        'Colunas duplas causam mistura de texto',
        'Evite headers/footers com informações importantes',
      ],
      scoringFactors: [
        { factor: 'Título do cargo', weight: 0.30, description: 'Match exato com o cargo anunciado' },
        { factor: 'Keywords técnicas', weight: 0.25, description: 'Termos técnicos do job description' },
        { factor: 'Experiência relevante', weight: 0.20, description: 'Anos e empresas compatíveis' },
        { factor: 'Educação', weight: 0.10, description: 'Grau e área de formação' },
        { factor: 'Habilidades listadas', weight: 0.15, description: 'Skills explicitamente listadas' },
      ],
    },
  },

  lever: {
    system: 'lever',
    name: 'Lever',
    rules: {
      preferSimpleFormatting: false,
      avoidTables: false,
      avoidColumns: true,
      avoidHeaders: false,
      avoidImages: true,
      avoidGraphics: false,
      parsesLinkedInUrls: true,
      parsesGithubUrls: true,
      requiresStandardSections: false,
      keywordMatchingAlgorithm: 'semantic',
      weightsTitleHighly: false,
      weightsFirstPageHighly: false,
      maxResumePages: 3,
      requiresSeparateDateFormat: false,
      preferredDateFormat: 'Mês YYYY',
      requiresPhoneFormat: 'qualquer formato',
      tips: [
        'Lever usa NLP — contexto importa mais que keywords exatas',
        'Descreva impacto com números: "aumentei X em Y%"',
        'LinkedIn é integrado — mantenha perfil atualizado',
        'Pode ter até 3 páginas sem penalização',
        'Cover letter tem peso significativo no Lever',
      ],
      warnings: [
        'Colunas duplas ainda causam problemas de parsing',
        'Logos de empresas podem confundir o parser',
      ],
      scoringFactors: [
        { factor: 'Impacto quantificado', weight: 0.35, description: 'Resultados com números e métricas' },
        { factor: 'Contexto semântico', weight: 0.25, description: 'Relevância geral do perfil' },
        { factor: 'Progressão de carreira', weight: 0.20, description: 'Crescimento ao longo do tempo' },
        { factor: 'Keywords', weight: 0.10, description: 'Termos específicos da vaga' },
        { factor: 'Cover letter', weight: 0.10, description: 'Qualidade e personalização' },
      ],
    },
  },

  workday: {
    system: 'workday',
    name: 'Workday',
    rules: {
      preferSimpleFormatting: true,
      avoidTables: true,
      avoidColumns: true,
      avoidHeaders: true,
      avoidImages: true,
      avoidGraphics: true,
      parsesLinkedInUrls: false,
      parsesGithubUrls: false,
      requiresStandardSections: true,
      keywordMatchingAlgorithm: 'exact',
      weightsTitleHighly: true,
      weightsFirstPageHighly: true,
      maxResumePages: 1,
      requiresSeparateDateFormat: true,
      preferredDateFormat: 'MM/DD/YYYY',
      requiresPhoneFormat: '(11) 99999-9999',
      tips: [
        'Workday é o ATS mais rígido — simplicidade é essencial',
        'Use EXATAMENTE as palavras do job description',
        'Prefira 1 página — Workday pesa fortemente o primeiro conteúdo',
        'Liste cada skill separadamente na seção de habilidades',
        'Datas no formato MM/YYYY evitam erros de parsing',
      ],
      warnings: [
        'NUNCA use tabelas — Workday não consegue parsear',
        'Headers e footers são completamente ignorados',
        'Evite caracteres especiais e símbolos',
        'PDFs com camadas podem falhar — use PDF simples',
        'Workday ignora formatação rich text',
      ],
      scoringFactors: [
        { factor: 'Match exato de keywords', weight: 0.40, description: 'Palavras idênticas ao anúncio' },
        { factor: 'Título atual', weight: 0.25, description: 'Cargo atual vs cargo da vaga' },
        { factor: 'Habilidades listadas', weight: 0.20, description: 'Skills na seção dedicada' },
        { factor: 'Localização', weight: 0.10, description: 'Proximidade geográfica' },
        { factor: 'Educação', weight: 0.05, description: 'Requisitos mínimos' },
      ],
    },
  },

  gupy: {
    system: 'gupy',
    name: 'Gupy',
    rules: {
      preferSimpleFormatting: false,
      avoidTables: false,
      avoidColumns: false,
      avoidHeaders: false,
      avoidImages: false,
      avoidGraphics: false,
      parsesLinkedInUrls: true,
      parsesGithubUrls: false,
      requiresStandardSections: false,
      keywordMatchingAlgorithm: 'semantic',
      weightsTitleHighly: false,
      weightsFirstPageHighly: false,
      maxResumePages: 5,
      requiresSeparateDateFormat: false,
      preferredDateFormat: 'MM/YYYY',
      requiresPhoneFormat: '(11) 99999-9999',
      tips: [
        'Gupy usa IA própria — descreva experiências com riqueza de contexto',
        'Preencha TODOS os campos do formulário Gupy, não só o currículo',
        'Testes comportamentais têm peso alto no Gupy',
        'Vídeo de apresentação aumenta chances significativamente',
        'Portfolio e GitHub linkados diretamente no perfil',
      ],
      warnings: [
        'O currículo em si tem menos peso que o perfil Gupy completo',
        'Não pule os testes de fit cultural',
      ],
      scoringFactors: [
        { factor: 'Perfil Gupy completo', weight: 0.30, description: 'Completude do cadastro na plataforma' },
        { factor: 'Testes comportamentais', weight: 0.25, description: 'Fit cultural e comportamental' },
        { factor: 'Experiência relevante', weight: 0.25, description: 'Match com requisitos da vaga' },
        { factor: 'Keywords do currículo', weight: 0.10, description: 'Termos técnicos relevantes' },
        { factor: 'Vídeo/Portfolio', weight: 0.10, description: 'Material complementar' },
      ],
    },
  },

  linkedin: {
    system: 'linkedin',
    name: 'LinkedIn Easy Apply',
    rules: {
      preferSimpleFormatting: false,
      avoidTables: false,
      avoidColumns: false,
      avoidHeaders: false,
      avoidImages: false,
      avoidGraphics: false,
      parsesLinkedInUrls: true,
      parsesGithubUrls: true,
      requiresStandardSections: false,
      keywordMatchingAlgorithm: 'semantic',
      weightsTitleHighly: true,
      weightsFirstPageHighly: false,
      maxResumePages: 3,
      requiresSeparateDateFormat: false,
      preferredDateFormat: 'qualquer',
      requiresPhoneFormat: 'qualquer',
      tips: [
        'Perfil LinkedIn completo é mais importante que o currículo',
        'Conexões em comum com recrutadores aumentam visibilidade',
        'LinkedIn Score (SSI) influencia ranking nas buscas',
        'Recomendações de colegas têm peso real',
        'Atividade recente na plataforma sinaliza engajamento',
      ],
      warnings: [
        'Easy Apply tem muita concorrência — personalize a cover letter',
        'Perfil desatualizado reduz ranking nos resultados',
      ],
      scoringFactors: [
        { factor: 'Match de keywords', weight: 0.30, description: 'Alinhamento com a descrição da vaga' },
        { factor: 'Completude do perfil', weight: 0.25, description: 'Perfil LinkedIn 100% preenchido' },
        { factor: 'Conexões relevantes', weight: 0.20, description: 'Pessoas na empresa ou área' },
        { factor: 'Atividade recente', weight: 0.15, description: 'Posts, comentários, engajamento' },
        { factor: 'Recomendações', weight: 0.10, description: 'Endossos e recomendações escritas' },
      ],
    },
  },

  // Defaults para sistemas menos comuns
  indeed: { system: 'indeed', name: 'Indeed', rules: { preferSimpleFormatting: true, avoidTables: true, avoidColumns: true, avoidHeaders: false, avoidImages: true, avoidGraphics: true, parsesLinkedInUrls: false, parsesGithubUrls: false, requiresStandardSections: true, keywordMatchingAlgorithm: 'exact', weightsTitleHighly: true, weightsFirstPageHighly: true, maxResumePages: 2, requiresSeparateDateFormat: false, preferredDateFormat: 'MM/YYYY', requiresPhoneFormat: 'qualquer', tips: ['Keywords exatas do anúncio são essenciais', 'Seções padrão bem definidas'], warnings: ['Evite tabelas e colunas'], scoringFactors: [{ factor: 'Keywords', weight: 0.5, description: 'Match exato' }, { factor: 'Experiência', weight: 0.3, description: 'Anos relevantes' }, { factor: 'Educação', weight: 0.2, description: 'Formação mínima' }] } },
  taleo: { system: 'taleo', name: 'Oracle Taleo', rules: { preferSimpleFormatting: true, avoidTables: true, avoidColumns: true, avoidHeaders: true, avoidImages: true, avoidGraphics: true, parsesLinkedInUrls: false, parsesGithubUrls: false, requiresStandardSections: true, keywordMatchingAlgorithm: 'exact', weightsTitleHighly: true, weightsFirstPageHighly: true, maxResumePages: 1, requiresSeparateDateFormat: true, preferredDateFormat: 'MM/YYYY', requiresPhoneFormat: '(11) 99999-9999', tips: ['Taleo é muito antigo — máxima simplicidade', 'Use apenas texto puro'], warnings: ['Qualquer formatação avançada quebra o Taleo', 'PDFs podem ter problemas — prefira .docx'], scoringFactors: [{ factor: 'Keywords exatas', weight: 0.6, description: 'Palavras idênticas' }, { factor: 'Cargo atual', weight: 0.25, description: 'Match de título' }, { factor: 'Educação', weight: 0.15, description: 'Formação mínima' }] } },
  icims: { system: 'icims', name: 'iCIMS', rules: { preferSimpleFormatting: true, avoidTables: false, avoidColumns: true, avoidHeaders: false, avoidImages: true, avoidGraphics: true, parsesLinkedInUrls: true, parsesGithubUrls: false, requiresStandardSections: true, keywordMatchingAlgorithm: 'fuzzy', weightsTitleHighly: true, weightsFirstPageHighly: true, maxResumePages: 2, requiresSeparateDateFormat: false, preferredDateFormat: 'MM/YYYY', requiresPhoneFormat: 'qualquer', tips: ['iCIMS aceita tabelas simples', 'Keywords com variações são reconhecidas'], warnings: ['Colunas duplas ainda causam problemas'], scoringFactors: [{ factor: 'Keywords', weight: 0.4, description: 'Match com variações' }, { factor: 'Experiência', weight: 0.35, description: 'Anos e relevância' }, { factor: 'Skills', weight: 0.25, description: 'Habilidades listadas' }] } },
  breezy: { system: 'breezy', name: 'Breezy HR', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: false, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: true, parsesGithubUrls: true, requiresStandardSections: false, keywordMatchingAlgorithm: 'semantic', weightsTitleHighly: false, weightsFirstPageHighly: false, maxResumePages: 5, requiresSeparateDateFormat: false, preferredDateFormat: 'qualquer', requiresPhoneFormat: 'qualquer', tips: ['Breezy é moderno e flexível', 'Foco em qualidade do conteúdo'], warnings: ['Pouca concorrência — personalize bastante'], scoringFactors: [{ factor: 'Relevância geral', weight: 0.5, description: 'Fit semântico' }, { factor: 'Experiência', weight: 0.3, description: 'Histórico relevante' }, { factor: 'Skills', weight: 0.2, description: 'Competências técnicas' }] } },
  bamboohr: { system: 'bamboohr', name: 'BambooHR', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: false, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: true, parsesGithubUrls: false, requiresStandardSections: false, keywordMatchingAlgorithm: 'fuzzy', weightsTitleHighly: false, weightsFirstPageHighly: false, maxResumePages: 3, requiresSeparateDateFormat: false, preferredDateFormat: 'qualquer', requiresPhoneFormat: 'qualquer', tips: ['BambooHR foca em fit cultural', 'Complete todos os campos do formulário'], warnings: ['Processo costuma ter múltiplas etapas'], scoringFactors: [{ factor: 'Fit cultural', weight: 0.4, description: 'Alinhamento com valores' }, { factor: 'Experiência', weight: 0.35, description: 'Histórico relevante' }, { factor: 'Skills', weight: 0.25, description: 'Competências técnicas' }] } },
  recruitee: { system: 'recruitee', name: 'Recruitee', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: false, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: true, parsesGithubUrls: true, requiresStandardSections: false, keywordMatchingAlgorithm: 'semantic', weightsTitleHighly: false, weightsFirstPageHighly: false, maxResumePages: 3, requiresSeparateDateFormat: false, preferredDateFormat: 'qualquer', requiresPhoneFormat: 'qualquer', tips: ['Recruitee valoriza portfolio e trabalhos anteriores', 'Links para projetos têm peso alto'], warnings: [], scoringFactors: [{ factor: 'Portfolio/Projetos', weight: 0.4, description: 'Trabalhos anteriores' }, { factor: 'Experiência', weight: 0.35, description: 'Histórico relevante' }, { factor: 'Skills', weight: 0.25, description: 'Competências técnicas' }] } },
  smartrecruiters: { system: 'smartrecruiters', name: 'SmartRecruiters', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: true, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: true, parsesGithubUrls: true, requiresStandardSections: false, keywordMatchingAlgorithm: 'semantic', weightsTitleHighly: true, weightsFirstPageHighly: false, maxResumePages: 3, requiresSeparateDateFormat: false, preferredDateFormat: 'qualquer', requiresPhoneFormat: 'qualquer', tips: ['SmartRecruiters integra com LinkedIn', 'Score de candidato é visível para recrutador'], warnings: ['Colunas duplas causam problemas de parsing'], scoringFactors: [{ factor: 'Keywords', weight: 0.35, description: 'Match semântico' }, { factor: 'Experiência', weight: 0.35, description: 'Histórico relevante' }, { factor: 'Skills', weight: 0.30, description: 'Competências técnicas' }] } },
  aplysia: { system: 'aplysia', name: 'Aplysia', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: false, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: true, parsesGithubUrls: false, requiresStandardSections: false, keywordMatchingAlgorithm: 'semantic', weightsTitleHighly: false, weightsFirstPageHighly: false, maxResumePages: 3, requiresSeparateDateFormat: false, preferredDateFormat: 'qualquer', requiresPhoneFormat: 'qualquer', tips: ['ATS brasileiro — contexto local importa', 'Experiências em empresas brasileiras têm peso'], warnings: [], scoringFactors: [{ factor: 'Relevância', weight: 0.5, description: 'Fit geral' }, { factor: 'Experiência', weight: 0.3, description: 'Histórico' }, { factor: 'Skills', weight: 0.2, description: 'Competências' }] } },
  catho: { system: 'catho', name: 'Catho', rules: { preferSimpleFormatting: false, avoidTables: false, avoidColumns: false, avoidHeaders: false, avoidImages: false, avoidGraphics: false, parsesLinkedInUrls: false, parsesGithubUrls: false, requiresStandardSections: true, keywordMatchingAlgorithm: 'fuzzy', weightsTitleHighly: true, weightsFirstPageHighly: false, maxResumePages: 3, requiresSeparateDateFormat: false, preferredDateFormat: 'MM/YYYY', requiresPhoneFormat: '(11) 99999-9999', tips: ['Perfil Catho completo é fundamental', 'Foto profissional aumenta visualizações em 40%', 'Salário pretendido influencia filtros'], warnings: ['Currículo fora do padrão Catho tem menos visibilidade'], scoringFactors: [{ factor: 'Completude do perfil', weight: 0.35, description: 'Perfil 100% preenchido' }, { factor: 'Cargo pretendido', weight: 0.30, description: 'Match com vaga' }, { factor: 'Experiência', weight: 0.20, description: 'Histórico relevante' }, { factor: 'Educação', weight: 0.15, description: 'Formação' }] } },
  unknown: { system: 'unknown', name: 'ATS Desconhecido', rules: { preferSimpleFormatting: true, avoidTables: true, avoidColumns: true, avoidHeaders: false, avoidImages: true, avoidGraphics: true, parsesLinkedInUrls: false, parsesGithubUrls: false, requiresStandardSections: true, keywordMatchingAlgorithm: 'exact', weightsTitleHighly: true, weightsFirstPageHighly: true, maxResumePages: 2, requiresSeparateDateFormat: false, preferredDateFormat: 'MM/YYYY', requiresPhoneFormat: 'qualquer', tips: ['Use formatação simples e segura', 'Keywords exatas do anúncio'], warnings: ['ATS não identificado — adote abordagem conservadora'], scoringFactors: [{ factor: 'Keywords', weight: 0.5, description: 'Match de palavras' }, { factor: 'Experiência', weight: 0.3, description: 'Histórico' }, { factor: 'Skills', weight: 0.2, description: 'Competências' }] } },
};

// Padrões de URL para detectar o ATS
const ATS_URL_PATTERNS: Array<{ pattern: RegExp; system: ATSSystem }> = [
  { pattern: /greenhouse\.io|boards\.greenhouse/i, system: 'greenhouse' },
  { pattern: /lever\.co|jobs\.lever/i, system: 'lever' },
  { pattern: /workday\.com|myworkdayjobs/i, system: 'workday' },
  { pattern: /gupy\.io|portal\.gupy/i, system: 'gupy' },
  { pattern: /linkedin\.com\/jobs/i, system: 'linkedin' },
  { pattern: /indeed\.com/i, system: 'indeed' },
  { pattern: /taleo\.net|oraclecloud.*taleo/i, system: 'taleo' },
  { pattern: /icims\.com/i, system: 'icims' },
  { pattern: /breezy\.hr/i, system: 'breezy' },
  { pattern: /bamboohr\.com/i, system: 'bamboohr' },
  { pattern: /recruitee\.com/i, system: 'recruitee' },
  { pattern: /smartrecruiters\.com/i, system: 'smartrecruiters' },
  { pattern: /catho\.com\.br/i, system: 'catho' },
];

// Empresas conhecidas e seus ATS
const COMPANY_ATS_MAP: Record<string, ATSSystem> = {
  'nubank': 'greenhouse',
  'mercado livre': 'workday',
  'mercadolibre': 'workday',
  'ifood': 'greenhouse',
  'stone': 'lever',
  'pagbank': 'gupy',
  'pagseguro': 'gupy',
  'itaú': 'workday',
  'itau': 'workday',
  'bradesco': 'taleo',
  'santander': 'workday',
  'ambev': 'workday',
  'magazine luiza': 'gupy',
  'magalu': 'gupy',
  'totvs': 'gupy',
  'ci&t': 'lever',
  'loggi': 'greenhouse',
  'loft': 'greenhouse',
  'creditas': 'greenhouse',
  'quintoandar': 'greenhouse',
  'quinto andar': 'greenhouse',
  'vtex': 'greenhouse',
  'contaazul': 'recruitee',
  'rdstation': 'breezy',
  'hotmart': 'greenhouse',
  'cloudwalk': 'lever',
  'picpay': 'greenhouse',
  'inter': 'gupy',
  'c6 bank': 'lever',
  'xp': 'greenhouse',
  'b3': 'workday',
  'google': 'workday',
  'amazon': 'icims',
  'microsoft': 'workday',
  'meta': 'workday',
  'oracle': 'taleo',
  'sap': 'workday',
};

export function detectATS(options: {
  applyUrl?: string;
  companyName?: string;
  jobTitle?: string;
}): ATSProfile {
  const { applyUrl, companyName } = options;

  // 1. Detecta pela URL (mais confiável)
  if (applyUrl) {
    for (const { pattern, system } of ATS_URL_PATTERNS) {
      if (pattern.test(applyUrl)) {
        return {
          ...ATS_PROFILES[system],
          confidence: 0.95,
          detectionSource: `URL: ${applyUrl}`,
        };
      }
    }
  }

  // 2. Detecta pela empresa (base de conhecimento)
  if (companyName) {
    const normalized = companyName.toLowerCase().trim();
    for (const [company, system] of Object.entries(COMPANY_ATS_MAP)) {
      if (normalized.includes(company) || company.includes(normalized)) {
        return {
          ...ATS_PROFILES[system],
          confidence: 0.80,
          detectionSource: `Empresa conhecida: ${companyName}`,
        };
      }
    }
  }

  // 3. Fallback: unknown com dicas genéricas seguras
  return {
    ...ATS_PROFILES.unknown,
    confidence: 0.30,
    detectionSource: 'ATS não identificado — usando regras conservadoras',
  };
}

export { ATS_PROFILES };
