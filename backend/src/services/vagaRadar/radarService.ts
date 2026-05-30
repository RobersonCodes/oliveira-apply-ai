/**
 * Vaga Radar — Detecção Preditiva de Vagas
 * 
 * Monitora sinais de mercado para prever quais vagas vão abrir
 * nos próximos 30 dias, antes de serem publicadas.
 * 
 * Fontes de sinais:
 * 1. LinkedIn: novas contratações de líderes (indica expansão de time)
 * 2. Crunchbase/news: rodadas de investimento (indica contratação em massa)
 * 3. Demissões públicas: empresas que demitem sêniors depois contratam novos
 * 4. Movimentação de cargos: quando VP de Engenharia muda → time muda
 * 5. Postagens da empresa: menções a crescimento, novos produtos, expansão
 */

import OpenAI from 'openai';
import logger from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SignalType =
  | 'funding_round'        // Rodada de investimento
  | 'leadership_hire'      // Contratação de líder sênior
  | 'product_launch'       // Lançamento de produto
  | 'expansion'            // Expansão geográfica ou de mercado
  | 'layoff_recovery'      // Empresa se recuperando de demissões
  | 'ipo_preparation'      // Preparação para IPO
  | 'acquisition'          // Aquisição (adquirindo ou sendo adquirida)
  | 'tech_migration'       // Migração de tecnologia
  | 'regulatory_compliance'// Adequação a regulamentações
  | 'competitor_move';     // Concorrente fez algo que força reação

export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface MarketSignal {
  type: SignalType;
  company: string;
  description: string;
  strength: SignalStrength;
  source: string;
  detectedAt: Date;
  predictedJobOpenings: PredictedOpening[];
  confidenceScore: number; // 0-100
  timeToOpeningDays: number; // estimativa de quando a vaga vai abrir
}

export interface PredictedOpening {
  role: string;
  department: string;
  seniorityLevel: string;
  estimatedSalary?: { min: number; max: number };
  probability: number; // 0-100
  reasoning: string;
  actionAdvice: string;
}

export interface RadarAlert {
  id: string;
  company: string;
  signal: MarketSignal;
  matchScore: number; // quão relevante é para o usuário (0-100)
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  createdAt: Date;
}

// Mapeamento de sinais para tipos de vaga esperados
const SIGNAL_TO_JOBS: Record<SignalType, {
  roles: string[];
  timeToOpenDays: number;
  probability: number;
  departments: string[];
}> = {
  funding_round: {
    roles: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'Product Manager', 'Data Scientist'],
    timeToOpenDays: 30,
    probability: 85,
    departments: ['Engineering', 'Product', 'Data'],
  },
  leadership_hire: {
    roles: ['Software Engineer', 'Senior Developer', 'Engineering Manager'],
    timeToOpenDays: 45,
    probability: 70,
    departments: ['Engineering'],
  },
  product_launch: {
    roles: ['Full Stack Developer', 'Backend Engineer', 'Frontend Developer', 'QA Engineer', 'DevOps'],
    timeToOpenDays: 20,
    probability: 75,
    departments: ['Engineering', 'Product'],
  },
  expansion: {
    roles: ['Software Engineer', 'Sales Engineer', 'Solutions Architect', 'Customer Success'],
    timeToOpenDays: 35,
    probability: 80,
    departments: ['Engineering', 'Sales', 'CS'],
  },
  layoff_recovery: {
    roles: ['Software Engineer', 'Senior Developer', 'Tech Lead'],
    timeToOpenDays: 90,
    probability: 55,
    departments: ['Engineering'],
  },
  ipo_preparation: {
    roles: ['Software Engineer', 'Security Engineer', 'Compliance Engineer', 'Data Engineer'],
    timeToOpenDays: 60,
    probability: 65,
    departments: ['Engineering', 'Security', 'Data'],
  },
  acquisition: {
    roles: ['Integration Engineer', 'Software Engineer', 'DevOps', 'Solutions Architect'],
    timeToOpenDays: 45,
    probability: 60,
    departments: ['Engineering'],
  },
  tech_migration: {
    roles: ['Cloud Engineer', 'DevOps Engineer', 'Platform Engineer', 'Software Engineer'],
    timeToOpenDays: 15,
    probability: 78,
    departments: ['Engineering', 'Platform'],
  },
  regulatory_compliance: {
    roles: ['Security Engineer', 'Compliance Developer', 'Backend Engineer', 'Data Engineer'],
    timeToOpenDays: 25,
    probability: 70,
    departments: ['Engineering', 'Security'],
  },
  competitor_move: {
    roles: ['Software Engineer', 'Product Manager', 'Data Scientist', 'ML Engineer'],
    timeToOpenDays: 40,
    probability: 50,
    departments: ['Engineering', 'Product', 'Data'],
  },
};

export async function analyzeCompanySignals(
  company: string,
  newsText: string,
  userSkills: string[] = [],
): Promise<MarketSignal[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{
        role: 'system',
        content: `Você é um analista de mercado especializado em detectar sinais de contratação em empresas de tecnologia brasileiras.
Analise as informações fornecidas e identifique sinais que indicam abertura de vagas futuras.
Responda APENAS em JSON válido.`,
      }, {
        role: 'user',
        content: `Analise estes sinais da empresa "${company}" e preveja vagas futuras.

Usuário tem skills: ${userSkills.join(', ')}

Informações/notícias:
${newsText.slice(0, 1500)}

Retorne JSON:
{
  "signals": [
    {
      "type": "funding_round|leadership_hire|product_launch|expansion|tech_migration|...",
      "description": "descrição do sinal",
      "strength": "weak|moderate|strong|very_strong",
      "confidenceScore": 0-100,
      "timeToOpeningDays": número,
      "predictedRoles": ["cargo1", "cargo2"],
      "reasoning": "por que este sinal indica contratação",
      "actionAdvice": "o que o candidato deve fazer agora"
    }
  ]
}`,
      }],
    });

    const text = response.choices[0]?.message?.content || '{"signals":[]}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return (parsed.signals || []).map((s: any) => {
      const signalType = (s.type || 'expansion') as SignalType;
      const signalConfig = SIGNAL_TO_JOBS[signalType] || SIGNAL_TO_JOBS.expansion;

      const predictedJobOpenings: PredictedOpening[] = (s.predictedRoles || signalConfig.roles).slice(0, 4).map((role: string) => ({
        role,
        department: signalConfig.departments[0],
        seniorityLevel: 'SENIOR',
        probability: signalConfig.probability,
        reasoning: s.reasoning || 'Sinal de mercado detectado',
        actionAdvice: s.actionAdvice || 'Prepare seu perfil e entre em contato com funcionários da empresa',
      }));

      return {
        type: signalType,
        company,
        description: s.description || 'Sinal detectado',
        strength: (s.strength || 'moderate') as SignalStrength,
        source: 'AI Analysis',
        detectedAt: new Date(),
        predictedJobOpenings,
        confidenceScore: s.confidenceScore || 60,
        timeToOpeningDays: s.timeToOpeningDays || signalConfig.timeToOpenDays,
      } as MarketSignal;
    });
  } catch (err) {
    logger.error('Signal analysis failed', { err });
    return [];
  }
}

export function generateRadarAlert(
  signal: MarketSignal,
  userSkills: string[],
  targetRoles: string[],
): RadarAlert {
  // Calcula match score baseado nas skills do usuário vs vagas previstas
  const predictedRoles = signal.predictedJobOpenings.map(j => j.role.toLowerCase());
  const roleMatch = targetRoles.some(r => predictedRoles.some(p => p.includes(r.toLowerCase()))) ? 30 : 0;
  const skillRelevance = signal.type === 'tech_migration' || signal.type === 'funding_round' ? 20 : 10;
  const strengthBonus: Record<SignalStrength, number> = { weak: 0, moderate: 10, strong: 20, very_strong: 30 };
  const matchScore = Math.min(100, 40 + roleMatch + skillRelevance + strengthBonus[signal.strength]);

  const urgency: RadarAlert['urgency'] =
    signal.timeToOpeningDays <= 14 ? 'critical' :
    signal.timeToOpeningDays <= 30 ? 'high' :
    signal.timeToOpeningDays <= 60 ? 'medium' : 'low';

  const urgencyAction: Record<typeof urgency, string> = {
    critical: `🔥 Aja AGORA — vagas podem abrir em ${signal.timeToOpeningDays} dias! Conecte-se com funcionários da ${signal.company} hoje.`,
    high: `⚡ Prepare-se nos próximos dias — otimize seu perfil para ${signal.company} antes das vagas abrirem.`,
    medium: `📡 Monitore a ${signal.company} — vagas esperadas em ~${signal.timeToOpeningDays} dias.`,
    low: `👀 Sinal fraco em ${signal.company} — mantenha no radar para os próximos meses.`,
  };

  return {
    id: `radar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    company: signal.company,
    signal,
    matchScore,
    urgency,
    action: urgencyAction[urgency],
    createdAt: new Date(),
  };
}

export function getSignalTypeLabel(type: SignalType): string {
  const labels: Record<SignalType, string> = {
    funding_round: '💰 Rodada de Investimento',
    leadership_hire: '👔 Contratação de Liderança',
    product_launch: '🚀 Lançamento de Produto',
    expansion: '🌎 Expansão',
    layoff_recovery: '🔄 Recuperação Pós-Demissão',
    ipo_preparation: '📈 Preparação para IPO',
    acquisition: '🤝 Aquisição',
    tech_migration: '⚙️ Migração Tecnológica',
    regulatory_compliance: '⚖️ Adequação Regulatória',
    competitor_move: '🎯 Movimento da Concorrência',
  };
  return labels[type] || type;
}

// Sinal sintético para demonstração quando não há notícias reais
export function generateDemoSignals(userSkills: string[]): RadarAlert[] {
  const demoSignals: MarketSignal[] = [
    {
      type: 'funding_round',
      company: 'Nubank',
      description: 'Nubank anuncia expansão para novos mercados na América Latina com aporte de $150M',
      strength: 'very_strong',
      source: 'Crunchbase + LinkedIn',
      detectedAt: new Date(),
      predictedJobOpenings: [
        { role: 'Senior Backend Engineer', department: 'Engineering', seniorityLevel: 'SENIOR', probability: 90, reasoning: 'Expansão requer infraestrutura escalável', actionAdvice: 'Conecte-se com engenheiros do Nubank no LinkedIn agora' },
        { role: 'Data Engineer', department: 'Data', seniorityLevel: 'MID', probability: 75, reasoning: 'Novos mercados = novos dados para processar', actionAdvice: 'Siga a página do Nubank e ative alertas de vaga' },
      ],
      confidenceScore: 88,
      timeToOpeningDays: 21,
    },
    {
      type: 'tech_migration',
      company: 'iFood',
      description: 'iFood migrando infraestrutura para microserviços em Go e Kubernetes',
      strength: 'strong',
      source: 'Tech blog + LinkedIn',
      detectedAt: new Date(),
      predictedJobOpenings: [
        { role: 'Go Developer', department: 'Engineering', seniorityLevel: 'SENIOR', probability: 85, reasoning: 'Migração para Go requer especialistas', actionAdvice: 'Destaque experiência com Go e Kubernetes no seu perfil' },
        { role: 'DevOps Engineer', department: 'Platform', seniorityLevel: 'SENIOR', probability: 80, reasoning: 'Kubernetes requer time de plataforma expandido', actionAdvice: 'Prepare cases de Kubernetes e container orchestration' },
      ],
      confidenceScore: 82,
      timeToOpeningDays: 14,
    },
    {
      type: 'leadership_hire',
      company: 'Stone',
      description: 'Stone contratou novo VP de Engenharia vindo do Stripe — histórico de expansão rápida de times',
      strength: 'moderate',
      source: 'LinkedIn',
      detectedAt: new Date(),
      predictedJobOpenings: [
        { role: 'Software Engineer', department: 'Engineering', seniorityLevel: 'MID', probability: 70, reasoning: 'Novo VP costuma reformar o time nos primeiros 90 dias', actionAdvice: 'Siga o novo VP no LinkedIn e engaje com posts dele' },
      ],
      confidenceScore: 65,
      timeToOpeningDays: 45,
    },
  ];

  return demoSignals.map(signal => generateRadarAlert(signal, userSkills, ['developer', 'engineer', 'data']));
}
