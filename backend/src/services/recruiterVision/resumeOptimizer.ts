/**
 * Recruiter Vision — Resume Optimizer
 * Otimiza currículo especificamente para o ATS detectado
 */

import OpenAI from 'openai';
import { ATSProfile } from './atsDetector';
import logger from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface OptimizationResult {
  originalContent: string;
  optimizedContent: string;
  atsScore: number;           // Score estimado no ATS (0-100)
  originalScore: number;      // Score antes da otimização
  improvements: string[];     // O que foi melhorado
  warnings: string[];         // Problemas que não puderam ser corrigidos
  keywordsAdded: string[];    // Keywords inseridas
  keywordsFound: string[];    // Keywords já presentes
  keywordsMissing: string[];  // Keywords importantes ausentes
  formattingFixes: string[];  // Correções de formatação aplicadas
  atsSpecificTips: string[];  // Dicas específicas para este ATS
}

export interface ATSScoreBreakdown {
  total: number;
  breakdown: Array<{
    factor: string;
    score: number;
    maxScore: number;
    description: string;
  }>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export async function optimizeForATS(
  resumeContent: string,
  jobDescription: string,
  atsProfile: ATSProfile,
  userSkills: string[] = [],
): Promise<OptimizationResult> {
  const rules = atsProfile.rules;

  // Extrai keywords do job description
  const keywords = await extractJobKeywords(jobDescription);

  // Calcula score original
  const originalScore = calculateQuickScore(resumeContent, keywords, atsProfile);

  // Monta prompt específico para o ATS detectado
  const systemPrompt = buildATSSystemPrompt(atsProfile);
  const userPrompt = buildOptimizationPrompt(resumeContent, jobDescription, keywords, atsProfile, userSkills);

  let optimizedContent = resumeContent;
  let improvements: string[] = [];
  let formattingFixes: string[] = [];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const result = parseOptimizationResponse(response.choices[0]?.message?.content || '');
    optimizedContent = result.content || resumeContent;
    improvements = result.improvements || [];
    formattingFixes = result.formattingFixes || [];
  } catch (err) {
    logger.error('OpenAI optimization failed', { err });
    // Fallback: aplica otimizações básicas sem IA
    const basicResult = applyBasicOptimizations(resumeContent, keywords, atsProfile);
    optimizedContent = basicResult.content;
    formattingFixes = basicResult.fixes;
  }

  // Keywords analysis
  const keywordsFound = keywords.filter(kw =>
    resumeContent.toLowerCase().includes(kw.toLowerCase()),
  );
  const keywordsMissing = keywords.filter(kw =>
    !resumeContent.toLowerCase().includes(kw.toLowerCase()),
  );
  const keywordsAdded = keywords.filter(kw =>
    !resumeContent.toLowerCase().includes(kw.toLowerCase()) &&
    optimizedContent.toLowerCase().includes(kw.toLowerCase()),
  );

  // Score final
  const atsScore = calculateQuickScore(optimizedContent, keywords, atsProfile);

  return {
    originalContent: resumeContent,
    optimizedContent,
    atsScore,
    originalScore,
    improvements,
    warnings: atsProfile.rules.warnings,
    keywordsAdded,
    keywordsFound,
    keywordsMissing: keywordsMissing.filter(kw => !keywordsAdded.includes(kw)),
    formattingFixes,
    atsSpecificTips: atsProfile.rules.tips,
  };
}

export function calculateATSScore(
  resumeContent: string,
  jobDescription: string,
  atsProfile: ATSProfile,
): ATSScoreBreakdown {
  const content = resumeContent.toLowerCase();
  const jd = jobDescription.toLowerCase();

  // Extrai keywords simples do JD
  const techWords = jd.match(/\b[a-z]{2,}(?:\.[a-z]+)?\b/g) || [];
  const keywords = [...new Set(techWords.filter(w => w.length > 3))].slice(0, 30);

  const breakdown = atsProfile.rules.scoringFactors.map(factor => {
    let score = 0;
    const max = Math.round(factor.weight * 100);

    switch (factor.factor) {
      case 'Título do cargo':
      case 'Título atual':
      case 'Cargo pretendido': {
        const titleLine = content.split('\n')[0] || '';
        const jdTitle = jd.split('\n')[0] || '';
        const titleWords = jdTitle.split(' ').filter(w => w.length > 3);
        const matches = titleWords.filter(w => titleLine.includes(w)).length;
        score = Math.min(max, Math.round((matches / Math.max(1, titleWords.length)) * max));
        break;
      }
      case 'Keywords técnicas':
      case 'Keywords':
      case 'Match exato de keywords':
      case 'Match de keywords': {
        const found = keywords.filter(kw => content.includes(kw)).length;
        score = Math.min(max, Math.round((found / Math.max(1, keywords.length)) * max));
        break;
      }
      case 'Habilidades listadas':
      case 'Skills': {
        const hasSkillsSection = content.includes('habilidade') || content.includes('skill') || content.includes('competência');
        score = hasSkillsSection ? max : Math.round(max * 0.5);
        break;
      }
      case 'Experiência relevante':
      case 'Experiência': {
        const hasExp = content.includes('experiência') || content.includes('experience');
        const yearsMatch = content.match(/\d+\s*anos?/);
        score = hasExp ? (yearsMatch ? max : Math.round(max * 0.7)) : Math.round(max * 0.3);
        break;
      }
      case 'Impacto quantificado': {
        const hasNumbers = (content.match(/\d+%|\d+x|\$\d+|r\$\d+/g) || []).length;
        score = Math.min(max, Math.round((hasNumbers / 5) * max));
        break;
      }
      default:
        score = Math.round(max * 0.6); // Default médio
    }

    return { factor: factor.factor, score, maxScore: max, description: factor.description };
  });

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);
  const grade = total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F';

  return { total, breakdown, grade };
}

// ── Helpers internos ──────────────────────────────────────────────────────────

async function extractJobKeywords(jobDescription: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Extraia as 20 palavras-chave mais importantes desta vaga para otimização de currículo ATS. Retorne APENAS uma lista JSON de strings, sem explicação.\n\nVaga:\n${jobDescription.slice(0, 1500)}`,
      }],
    });
    const text = response.choices[0]?.message?.content || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Fallback: extração simples
    const words = jobDescription.match(/\b[A-Za-z]{3,}\b/g) || [];
    return [...new Set(words)].slice(0, 20);
  }
}

function calculateQuickScore(content: string, keywords: string[], atsProfile: ATSProfile): number {
  const lower = content.toLowerCase();
  const found = keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
  const keywordScore = keywords.length > 0 ? (found / keywords.length) * 100 : 50;

  const hasStandardSections = ['experiência', 'educação', 'habilidades'].filter(s => lower.includes(s)).length;
  const structureScore = (hasStandardSections / 3) * 100;

  const lengthScore = content.length > 500 && content.length < 5000 ? 100 : 60;

  return Math.round(keywordScore * 0.5 + structureScore * 0.3 + lengthScore * 0.2);
}

function buildATSSystemPrompt(atsProfile: ATSProfile): string {
  const rules = atsProfile.rules;
  return `Você é um especialista em otimização de currículos para o sistema ATS ${atsProfile.name}.

Regras específicas do ${atsProfile.name}:
- Algoritmo de matching: ${rules.keywordMatchingAlgorithm}
- Formatação simples: ${rules.preferSimpleFormatting ? 'OBRIGATÓRIO' : 'opcional'}
- Evitar tabelas: ${rules.avoidTables ? 'SIM' : 'não necessário'}
- Evitar colunas: ${rules.avoidColumns ? 'SIM' : 'não necessário'}
- Máximo de páginas: ${rules.maxResumePages}
- Peso no título: ${rules.weightsTitleHighly ? 'ALTO' : 'normal'}
- Dicas: ${rules.tips.join('; ')}

Seu objetivo é otimizar o currículo especificamente para este ATS, mantendo autenticidade.
Responda em JSON com campos: content (currículo otimizado), improvements (array de melhorias feitas), formattingFixes (array de correções de formato).`;
}

function buildOptimizationPrompt(
  resumeContent: string,
  jobDescription: string,
  keywords: string[],
  atsProfile: ATSProfile,
  userSkills: string[],
): string {
  return `Otimize este currículo para o ${atsProfile.name} para a seguinte vaga.

KEYWORDS PRIORITÁRIAS: ${keywords.join(', ')}

HABILIDADES DO CANDIDATO: ${userSkills.join(', ')}

VAGA:
${jobDescription.slice(0, 1000)}

CURRÍCULO ATUAL:
${resumeContent.slice(0, 2000)}

Retorne JSON com: content, improvements[], formattingFixes[]`;
}

function parseOptimizationResponse(text: string): {
  content?: string;
  improvements?: string[];
  formattingFixes?: string[];
} {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { content: text, improvements: ['Conteúdo otimizado pela IA'], formattingFixes: [] };
  }
}

function applyBasicOptimizations(
  content: string,
  keywords: string[],
  atsProfile: ATSProfile,
): { content: string; fixes: string[] } {
  let result = content;
  const fixes: string[] = [];

  // Remove tabelas markdown simples se ATS não suporta
  if (atsProfile.rules.avoidTables && result.includes('|')) {
    result = result.replace(/\|.*\|/g, '').replace(/[-|]{3,}/g, '');
    fixes.push('Tabelas removidas');
  }

  // Garante seções padrão
  if (atsProfile.rules.requiresStandardSections) {
    if (!result.toLowerCase().includes('experiência') && !result.toLowerCase().includes('experience')) {
      fixes.push('Adicione uma seção "Experiência Profissional" ao seu currículo');
    }
    if (!result.toLowerCase().includes('habilidades') && !result.toLowerCase().includes('skills')) {
      fixes.push('Adicione uma seção "Habilidades" ao seu currículo');
    }
  }

  return { content: result, fixes };
}
