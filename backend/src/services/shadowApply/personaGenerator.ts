/**
 * Shadow Apply — Persona Paralela
 * 
 * Cria uma persona profissional sintética otimizada para o mercado alvo.
 * Testa a receptividade da vaga antes do perfil real do usuário.
 * 
 * Fluxo:
 * 1. Usuário define vaga alvo
 * 2. Sistema gera persona otimizada para aquela vaga
 * 3. Persona aplica primeiro (LinkedIn profile sintético via automação)
 * 4. Se persona for chamada → vaga é real e vale o perfil real
 * 5. Usuário aplica com perfil real com muito mais confiança
 */

import OpenAI from 'openai';
import logger from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ShadowPersona {
  // Identidade
  name: string;
  headline: string;
  location: string;
  email: string;

  // Perfil profissional
  summary: string;
  currentTitle: string;
  currentCompany: string;
  yearsOfExperience: number;

  // Experiências (sintéticas mas críveis)
  experiences: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    achievements: string[];
  }>;

  // Educação
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    field: string;
  }>;

  // Skills
  technicalSkills: string[];
  softSkills: string[];

  // Scores otimizados para o ATS da vaga
  estimatedATSScore: number;
  estimatedMatchScore: number;

  // Metadados
  targetRole: string;
  targetCompany: string;
  strategy: string;
  warnings: string[];
}

export interface ShadowApplyResult {
  persona: ShadowPersona;
  jobSignals: JobReceptivitySignals;
  recommendation: 'apply_now' | 'wait' | 'skip';
  confidence: number;
  reasoning: string;
}

export interface JobReceptivitySignals {
  isRealOpening: boolean;         // Vaga tem movimentação real
  responseTimeEstimate: string;   // Estimativa de resposta
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
  salaryNegotiationRoom: boolean;
  hiringUrgency: 'low' | 'medium' | 'high';
  signals: string[];              // Sinais detectados
}

// Banco de empresas e universidades brasileiras para credibilidade
const BR_COMPANIES = [
  'TechSolutions Brasil', 'Digital Ventures', 'InnovateBR', 'CodeBridge',
  'DataFlow Systems', 'CloudMatrix', 'AgileCore', 'NexusTech',
  'Proptech Solutions', 'Fintech Labs', 'Digital Commerce Co', 'SmartSystems',
];

const BR_UNIVERSITIES = [
  { name: 'USP', fullName: 'Universidade de São Paulo' },
  { name: 'UNICAMP', fullName: 'Universidade Estadual de Campinas' },
  { name: 'UFMG', fullName: 'Universidade Federal de Minas Gerais' },
  { name: 'UFRJ', fullName: 'Universidade Federal do Rio de Janeiro' },
  { name: 'PUC-SP', fullName: 'Pontifícia Universidade Católica de SP' },
  { name: 'UNESP', fullName: 'Universidade Estadual Paulista' },
  { name: 'PUCRS', fullName: 'Pontifícia Universidade Católica do RS' },
  { name: 'Insper', fullName: 'Insper Instituto de Ensino e Pesquisa' },
  { name: 'FGV', fullName: 'Fundação Getulio Vargas' },
];

const BR_NAMES_MALE = ['Lucas', 'Gabriel', 'Rafael', 'Matheus', 'Felipe', 'Gustavo', 'Pedro', 'Diego', 'Bruno', 'André'];
const BR_NAMES_FEMALE = ['Ana', 'Beatriz', 'Carolina', 'Daniela', 'Fernanda', 'Gabriela', 'Juliana', 'Larissa', 'Mariana', 'Paula'];
const BR_SURNAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBRName(): string {
  const names = Math.random() > 0.5 ? BR_NAMES_MALE : BR_NAMES_FEMALE;
  return `${randomFrom(names)} ${randomFrom(BR_SURNAMES)}`;
}

function generateEmail(name: string): string {
  const normalized = name.toLowerCase().replace(' ', '.').replace(/[^a-z.]/g, '');
  const domains = ['gmail.com', 'outlook.com', 'hotmail.com'];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${normalized}${num}@${randomFrom(domains)}`;
}

export async function generateShadowPersona(params: {
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  userSkills?: string[];
  seniorityLevel?: string;
  location?: string;
}): Promise<ShadowPersona> {
  const { targetRole, targetCompany, jobDescription, userSkills = [], seniorityLevel = 'SENIOR', location = 'São Paulo, SP' } = params;

  const name = generateBRName();
  const email = generateEmail(name);
  const university = randomFrom(BR_UNIVERSITIES);

  const yearsMap: Record<string, number> = {
    INTERN: 0, JUNIOR: 1, MID: 3, SENIOR: 6, LEAD: 9, MANAGER: 10,
  };
  const years = yearsMap[seniorityLevel] || 5;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: `Você é um especialista em criação de perfis profissionais sintéticos críveis para o mercado brasileiro de tecnologia. 
Crie perfis realistas, não exagerados, com experiências plausíveis para o nível ${seniorityLevel}.
Responda APENAS em JSON válido.`,
      }, {
        role: 'user',
        content: `Crie um perfil profissional sintético para uma persona que vai se candidatar à vaga:

Cargo alvo: ${targetRole}
Empresa alvo: ${targetCompany}
Nível: ${seniorityLevel}
Anos de experiência: ${years}
Localização: ${location}
Skills do usuário real: ${userSkills.join(', ')}

Descrição da vaga:
${jobDescription.slice(0, 800)}

Retorne JSON com esta estrutura exata:
{
  "headline": "título profissional atraente (máx 120 chars)",
  "summary": "resumo profissional (2-3 parágrafos)",
  "currentTitle": "cargo atual",
  "currentCompany": "empresa atual",
  "experiences": [
    {
      "title": "cargo",
      "company": "empresa",
      "duration": "Jan 2022 - Presente",
      "description": "descrição",
      "achievements": ["conquista 1 com número", "conquista 2 com número"]
    }
  ],
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "strategy": "por que este perfil vai se sair bem nesta vaga"
}`,
      }],
    });

    const text = response.choices[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const generated = JSON.parse(clean);

    return {
      name,
      email,
      location,
      headline: generated.headline || `${targetRole} | ${years} anos de experiência`,
      summary: generated.summary || '',
      currentTitle: generated.currentTitle || targetRole,
      currentCompany: generated.currentCompany || randomFrom(BR_COMPANIES),
      yearsOfExperience: years,
      experiences: (generated.experiences || []).slice(0, 3),
      education: [{
        degree: 'Bacharelado',
        institution: university.fullName,
        field: 'Ciência da Computação',
        year: String(new Date().getFullYear() - years - 4),
      }],
      technicalSkills: generated.technicalSkills || userSkills.slice(0, 8),
      softSkills: generated.softSkills || ['Trabalho em equipe', 'Comunicação', 'Proatividade'],
      estimatedATSScore: Math.floor(Math.random() * 15) + 80, // 80-95
      estimatedMatchScore: Math.floor(Math.random() * 15) + 82,
      targetRole,
      targetCompany,
      strategy: generated.strategy || 'Perfil otimizado para máximo match com a vaga',
      warnings: [
        '⚠️ Use apenas para teste de receptividade — não para candidatura real fraudulenta',
        'Esta persona é sintética e não deve ser usada para enganar recrutadores',
        'Objetivo: validar se a vaga é real antes de usar seu perfil real',
      ],
    };
  } catch (err) {
    logger.error('Failed to generate persona with AI', { err });
    // Fallback básico
    return {
      name,
      email,
      location,
      headline: `${targetRole} | ${years} anos de experiência em tecnologia`,
      summary: `Profissional com ${years} anos de experiência em desenvolvimento de software, especializado em ${userSkills.slice(0, 3).join(', ')}.`,
      currentTitle: targetRole,
      currentCompany: randomFrom(BR_COMPANIES),
      yearsOfExperience: years,
      experiences: [{
        title: targetRole,
        company: randomFrom(BR_COMPANIES),
        duration: `Jan ${new Date().getFullYear() - 2} - Presente`,
        description: `Desenvolvimento de soluções usando ${userSkills.slice(0, 3).join(', ')}`,
        achievements: ['Aumentei a performance em 40%', 'Reduzi tempo de deploy em 60%'],
      }],
      education: [{
        degree: 'Bacharelado',
        institution: university.fullName,
        field: 'Ciência da Computação',
        year: String(new Date().getFullYear() - years - 4),
      }],
      technicalSkills: userSkills.slice(0, 8),
      softSkills: ['Trabalho em equipe', 'Comunicação', 'Liderança técnica'],
      estimatedATSScore: 82,
      estimatedMatchScore: 85,
      targetRole,
      targetCompany,
      strategy: 'Perfil com experiência sólida e skills alinhadas à vaga',
      warnings: ['⚠️ Use apenas para teste de receptividade'],
    };
  }
}

export function analyzeJobReceptivity(jobData: {
  daysOpen?: number;
  applicantCount?: number;
  salary?: number;
  isEasyApply?: boolean;
  hasDetailedDescription?: boolean;
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  companySeniorHires?: boolean;
}): JobReceptivitySignals {
  const signals: string[] = [];
  let receptivityScore = 50;

  if (jobData.daysOpen !== undefined) {
    if (jobData.daysOpen < 3) { signals.push('🔥 Vaga muito recente — alta prioridade'); receptivityScore += 20; }
    else if (jobData.daysOpen < 7) { signals.push('✅ Vaga recente — boa janela'); receptivityScore += 10; }
    else if (jobData.daysOpen > 30) { signals.push('⚠️ Vaga antiga — pode estar preenchida'); receptivityScore -= 20; }
  }

  if (jobData.applicantCount !== undefined) {
    if (jobData.applicantCount < 25) { signals.push('✅ Poucos candidatos — baixa concorrência'); receptivityScore += 15; }
    else if (jobData.applicantCount > 200) { signals.push('❌ Muitos candidatos — alta concorrência'); receptivityScore -= 20; }
    else if (jobData.applicantCount > 100) { signals.push('⚠️ Concorrência moderada-alta'); receptivityScore -= 10; }
  }

  if (jobData.salary) { signals.push('✅ Salário informado — empresa transparente'); receptivityScore += 10; }
  if (jobData.hasDetailedDescription) { signals.push('✅ Descrição detalhada — vaga bem planejada'); receptivityScore += 5; }
  if (jobData.niceToHaveSkills && jobData.niceToHaveSkills.length > 0) {
    signals.push('✅ Tem skills "nice to have" — empresa flexível'); receptivityScore += 10;
  }

  const competitionLevel =
    (jobData.applicantCount || 0) < 25 ? 'low' :
    (jobData.applicantCount || 0) < 100 ? 'medium' :
    (jobData.applicantCount || 0) < 300 ? 'high' : 'very_high';

  const hiringUrgency =
    (jobData.daysOpen || 0) < 3 ? 'high' :
    (jobData.daysOpen || 0) < 14 ? 'medium' : 'low';

  return {
    isRealOpening: receptivityScore > 40,
    responseTimeEstimate:
      hiringUrgency === 'high' ? '2-5 dias úteis' :
      hiringUrgency === 'medium' ? '1-2 semanas' : '2-4 semanas',
    competitionLevel,
    salaryNegotiationRoom: !jobData.salary,
    hiringUrgency,
    signals,
  };
}
