/**
 * Conexão Cirúrgica — Networking Automatizado com Propósito
 * 
 * Cria uma sequência de interações orgânicas pré-candidatura durante 2 semanas.
 * Quando a candidatura chega, o recrutador já te conhece pelo nome.
 * 
 * Sequência padrão (14 dias):
 * Dia 1:   Seguir a empresa e 2-3 funcionários-chave
 * Dia 2-3: Curtir posts recentes da empresa
 * Dia 4-5: Comentar com conteúdo genuíno em posts técnicos
 * Dia 6-7: Curtir posts do recrutador/hiring manager
 * Dia 8-9: Comentar em post do hiring manager (insight técnico)
 * Dia 10:  Pedir conexão com mensagem personalizada
 * Dia 11-13: Engajar com resposta da conexão (se aceita)
 * Dia 14:  Aplicar para a vaga — o recrutador já conhece seu nome
 */

import OpenAI from 'openai';
import logger from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ActionType =
  | 'follow_company'
  | 'follow_person'
  | 'like_post'
  | 'comment_post'
  | 'connect_request'
  | 'send_message'
  | 'apply_job';

export type ActionStatus = 'pending' | 'scheduled' | 'done' | 'skipped' | 'failed';

export interface NetworkingAction {
  id: string;
  day: number;
  actionType: ActionType;
  target: string;          // nome/URL do alvo
  targetRole?: string;     // cargo do alvo
  content?: string;        // texto do comentário/mensagem
  scheduledFor: Date;
  status: ActionStatus;
  reasoning: string;       // por que esta ação neste momento
  impactScore: number;     // impacto estimado (0-10)
}

export interface ConnectionStrategy {
  company: string;
  jobTitle: string;
  targetPerson: string;
  targetPersonRole: string;
  totalDays: number;
  actions: NetworkingAction[];
  expectedOutcome: string;
  riskLevel: 'low' | 'medium' | 'high';
  tips: string[];
}

export interface CommentSuggestion {
  postContext: string;
  comment: string;
  tone: 'technical' | 'thoughtful' | 'question' | 'agreement';
  wordCount: number;
  engagementScore: number;
}

function generateActionId(): string {
  return `action-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function generateNetworkingStrategy(params: {
  userId: string;
  company: string;
  jobTitle: string;
  hiringManager?: string;
  recruiterName?: string;
  userSkills?: string[];
  jobDescription?: string;
  startDate?: Date;
}): Promise<ConnectionStrategy> {
  const {
    company,
    jobTitle,
    hiringManager,
    recruiterName,
    userSkills = [],
    jobDescription = '',
    startDate = new Date(),
  } = params;

  const targetPerson = hiringManager || recruiterName || `Recrutador(a) da ${company}`;
  const targetRole = hiringManager ? 'Engineering Manager' : 'Recruiter';

  // Gera conteúdo personalizado para comentários com IA
  const comments = await generatePersonalizedComments({
    company,
    jobTitle,
    targetPerson,
    userSkills,
    jobDescription,
  });

  const actions: NetworkingAction[] = [
    // Semana 1: Visibilidade
    {
      id: generateActionId(),
      day: 1,
      actionType: 'follow_company',
      target: company,
      scheduledFor: addDays(startDate, 0),
      status: 'pending',
      reasoning: 'Primeiro contato — seguir a empresa aumenta sua visibilidade nos algoritmos do LinkedIn',
      impactScore: 3,
    },
    {
      id: generateActionId(),
      day: 1,
      actionType: 'follow_person',
      target: targetPerson,
      targetRole,
      scheduledFor: addDays(startDate, 0),
      status: 'pending',
      reasoning: `Seguir ${targetPerson} cria o primeiro ponto de contato sem pressão`,
      impactScore: 4,
    },
    {
      id: generateActionId(),
      day: 2,
      actionType: 'like_post',
      target: `Post mais recente da ${company}`,
      scheduledFor: addDays(startDate, 1),
      status: 'pending',
      reasoning: 'Curtir posts da empresa mostra interesse genuíno — aparece nas notificações do recrutador',
      impactScore: 2,
    },
    {
      id: generateActionId(),
      day: 3,
      actionType: 'like_post',
      target: `Post técnico da ${company}`,
      scheduledFor: addDays(startDate, 2),
      status: 'pending',
      reasoning: 'Segunda interação em dias diferentes parece orgânica, não automática',
      impactScore: 2,
    },

    // Semana 1: Comentários técnicos
    {
      id: generateActionId(),
      day: 5,
      actionType: 'comment_post',
      target: `Post técnico de funcionário da ${company}`,
      content: comments[0] || `Excelente ponto sobre ${jobTitle.toLowerCase()}! Na minha experiência com ${userSkills[0] || 'tecnologia'}, vi resultados similares quando...`,
      scheduledFor: addDays(startDate, 4),
      status: 'pending',
      reasoning: 'Comentário técnico de qualidade é a ação de maior impacto — demonstra expertise real',
      impactScore: 8,
    },
    {
      id: generateActionId(),
      day: 7,
      actionType: 'like_post',
      target: `Post de ${targetPerson}`,
      scheduledFor: addDays(startDate, 6),
      status: 'pending',
      reasoning: `Curtir post de ${targetPerson} garante que você apareça nas notificações dele/a`,
      impactScore: 4,
    },

    // Semana 2: Conexão direta
    {
      id: generateActionId(),
      day: 9,
      actionType: 'comment_post',
      target: `Post de ${targetPerson}`,
      content: comments[1] || `Perspectiva muito interessante! Tenho trabalhado com ${userSkills.slice(0, 2).join(' e ')} e concordo com...`,
      scheduledFor: addDays(startDate, 8),
      status: 'pending',
      reasoning: `Comentar no post de ${targetPerson} garante que seu nome apareça diretamente para ele/a`,
      impactScore: 9,
    },
    {
      id: generateActionId(),
      day: 10,
      actionType: 'connect_request',
      target: targetPerson,
      targetRole,
      content: await generateConnectionMessage({ targetPerson, targetRole, company, jobTitle, userSkills }),
      scheduledFor: addDays(startDate, 9),
      status: 'pending',
      reasoning: 'Após 9 dias de interações, o pedido de conexão parece natural — não frio',
      impactScore: 10,
    },
    {
      id: generateActionId(),
      day: 12,
      actionType: 'like_post',
      target: `Novo post de ${targetPerson}`,
      scheduledFor: addDays(startDate, 11),
      status: 'pending',
      reasoning: 'Manter visibilidade enquanto aguarda conexão ser aceita',
      impactScore: 3,
    },
    {
      id: generateActionId(),
      day: 13,
      actionType: 'comment_post',
      target: `Artigo técnico relevante`,
      content: comments[2] || `Esse tema é muito relevante para quem trabalha com ${jobTitle}...`,
      scheduledFor: addDays(startDate, 12),
      status: 'pending',
      reasoning: 'Último comentário antes da candidatura — reforça expertise',
      impactScore: 6,
    },

    // Dia 14: Aplicar
    {
      id: generateActionId(),
      day: 14,
      actionType: 'apply_job',
      target: `${jobTitle} na ${company}`,
      content: `Candidatura com cover letter personalizada mencionando interações com ${targetPerson}`,
      scheduledFor: addDays(startDate, 13),
      status: 'pending',
      reasoning: '14 dias de visibilidade — o recrutador já conhece seu nome. Taxa de resposta 3x maior.',
      impactScore: 10,
    },
  ];

  return {
    company,
    jobTitle,
    targetPerson,
    targetPersonRole: targetRole,
    totalDays: 14,
    actions,
    expectedOutcome: `Após 14 dias de engajamento estratégico, ${targetPerson} já conhecerá seu nome e expertise. Quando a candidatura chegar, não será um desconhecido — aumentando a taxa de resposta em até 3x.`,
    riskLevel: 'low',
    tips: [
      'Nunca mencione diretamente que está se candidatando nos comentários',
      'Todos os comentários devem ter valor real — não elogie apenas',
      'Se a conexão for aceita antes do dia 10, envie mensagem de agradecimento natural',
      'Personalize cada comentário com sua experiência real',
      'Mantenha um intervalo de pelo menos 24h entre interações',
      'Se o hiring manager responder um comentário, isso é um sinal verde fortíssimo',
    ],
  };
}

async function generatePersonalizedComments(params: {
  company: string;
  jobTitle: string;
  targetPerson: string;
  userSkills: string[];
  jobDescription: string;
}): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      temperature: 0.8,
      messages: [{
        role: 'system',
        content: 'Você é um especialista em networking profissional. Crie comentários genuínos, técnicos e valiosos para LinkedIn. Nunca genéricos. Nunca mencionam candidatura.',
      }, {
        role: 'user',
        content: `Crie 3 comentários para usar no LinkedIn visando networking com ${params.targetPerson} da ${params.company}.

Vaga alvo: ${params.jobTitle}
Skills do usuário: ${params.userSkills.join(', ')}
Contexto da vaga: ${params.jobDescription.slice(0, 400)}

Regras:
- Cada comentário demonstra expertise real
- Entre 2-4 linhas
- Tom profissional mas humano
- Nunca menciona candidatura ou interesse na vaga
- Acrescenta valor à conversa

Retorne JSON: {"comments": ["comentário1", "comentário2", "comentário3"]}`,
      }],
    });

    const text = response.choices[0]?.message?.content || '{"comments":[]}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return parsed.comments || [];
  } catch {
    return [
      `Ótima reflexão! Trabalhando com ${params.userSkills[0] || 'tecnologia'} vi situação similar — a chave foi...`,
      `Concordo com a abordagem. Na prática, o que mais funcionou foi focar em métricas de impacto real.`,
      `Perspectiva valiosa. Esse é exatamente o tipo de desafio que torna a área tão interessante.`,
    ];
  }
}

async function generateConnectionMessage(params: {
  targetPerson: string;
  targetRole: string;
  company: string;
  jobTitle: string;
  userSkills: string[];
}): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Escreva uma mensagem de pedido de conexão no LinkedIn para ${params.targetPerson} (${params.targetRole}) da ${params.company}.

Skills do usuário: ${params.userSkills.slice(0, 3).join(', ')}
Tom: profissional, direto, sem menção a vaga

Máximo 300 caracteres. Retorne apenas o texto da mensagem.`,
      }],
    });
    return response.choices[0]?.message?.content?.trim() || `Olá ${params.targetPerson}! Tenho acompanhado o trabalho da ${params.company} e me identifico muito com a cultura de engenharia. Seria ótimo nos conectarmos!`;
  } catch {
    return `Olá ${params.targetPerson}! Tenho acompanhado os posts da ${params.company} e admiro muito a cultura técnica de vocês. Seria ótimo nos conectarmos!`;
  }
}

export async function generateCommentForPost(params: {
  postContent: string;
  userSkills: string[];
  tone: 'technical' | 'thoughtful' | 'question';
}): Promise<CommentSuggestion> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: `Crie um comentário LinkedIn para este post. Tom: ${params.tone}. Skills do usuário: ${params.userSkills.join(', ')}.

Post: ${params.postContent.slice(0, 500)}

Retorne JSON: {"comment": "texto", "tone": "${params.tone}", "engagementScore": 1-10}`,
      }],
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      postContext: params.postContent.slice(0, 100),
      comment: parsed.comment || 'Ótima perspectiva!',
      tone: params.tone,
      wordCount: (parsed.comment || '').split(' ').length,
      engagementScore: parsed.engagementScore || 7,
    };
  } catch {
    return {
      postContext: params.postContent.slice(0, 100),
      comment: 'Perspectiva muito relevante! Tenho visto esse padrão na prática também.',
      tone: params.tone,
      wordCount: 10,
      engagementScore: 6,
    };
  }
}
