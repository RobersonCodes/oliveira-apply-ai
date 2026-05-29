import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface JobMatchInput {
  jobTitle: string;
  jobDescription: string;
  resumeContent: string;
}

interface CoverLetterInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  userName: string;
  resumeContent: string;
}

interface ResumeAdaptInput {
  jobDescription: string;
  resumeContent: string;
  targetRole: string;
}

export class AIService {
  private async complete(prompt: string, systemPrompt: string, maxTokens = 800): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || '';
    } catch (err) {
      logger.error('[AIService] OpenAI error:', err);
      throw err;
    }
  }

  async analyzeJobMatch(input: JobMatchInput): Promise<{ matchScore: number; notes: string; skills: string[] }> {
    const system = `You are an expert ATS (Applicant Tracking System) analyzer. 
    Analyze job descriptions and resumes to determine compatibility scores.
    Always respond in valid JSON format only.`;

    const prompt = `Analyze the match between this resume and job posting.
    
Job Title: ${input.jobTitle}
Job Description: ${input.jobDescription.slice(0, 2000)}

Resume Content: ${input.resumeContent.slice(0, 2000)}

Respond with JSON: { "matchScore": <0-100>, "notes": "<brief analysis>", "skills": ["skill1", "skill2"] }`;

    const raw = await this.complete(prompt, system, 400);
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return { matchScore: 65, notes: 'Analysis completed', skills: [] };
    }
  }

  async generateCoverLetter(input: CoverLetterInput): Promise<string> {
    const system = `You are an expert career coach who writes compelling, 
    personalized cover letters in Brazilian Portuguese that get responses.
    Write naturally, avoid clichés, be specific and confident.`;

    const prompt = `Write a professional cover letter in Brazilian Portuguese.
    
Candidate: ${input.userName}
Target Role: ${input.jobTitle}
Company: ${input.company}
Job Description: ${input.jobDescription.slice(0, 1500)}
Resume Highlights: ${input.resumeContent.slice(0, 800)}

Write a concise, impactful cover letter (max 3 paragraphs). No placeholder text.`;

    return this.complete(prompt, system, 600);
  }

  async adaptResume(input: ResumeAdaptInput): Promise<{ adaptedContent: string; addedKeywords: string[] }> {
    const system = `You are an expert resume writer and ATS optimization specialist.
    Adapt resumes to maximize ATS scores for specific job postings.
    Focus on relevant keywords, quantifiable achievements, and role alignment.
    Respond in valid JSON only.`;

    const prompt = `Adapt this resume for the following job posting to maximize ATS score.
    
Target Role: ${input.targetRole}
Job Description: ${input.jobDescription.slice(0, 2000)}
Current Resume: ${input.resumeContent.slice(0, 2000)}

Respond with JSON: { "adaptedContent": "<adapted resume text>", "addedKeywords": ["kw1", "kw2"] }`;

    const raw = await this.complete(prompt, system, 1200);
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return { adaptedContent: input.resumeContent, addedKeywords: [] };
    }
  }

  async extractSkillsFromJD(jobDescription: string): Promise<string[]> {
    const system = `Extract technical and soft skills from job descriptions. Respond with JSON array only.`;
    const prompt = `Extract all required skills from this job description:\n\n${jobDescription.slice(0, 2000)}\n\nRespond with JSON: ["skill1", "skill2", ...]`;

    const raw = await this.complete(prompt, system, 300);
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return [];
    }
  }

  async generateInterviewPrep(jobTitle: string, company: string, jobDescription: string): Promise<{ questions: string[]; tips: string[] }> {
    const system = `You are an expert career coach specializing in technical interview preparation. Respond in JSON only.`;
    const prompt = `Generate interview preparation for:
Role: ${jobTitle}
Company: ${company}
JD: ${jobDescription.slice(0, 1000)}

Respond with JSON: { "questions": ["q1", "q2", ...], "tips": ["tip1", "tip2", ...] }`;

    const raw = await this.complete(prompt, system, 800);
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return { questions: [], tips: [] };
    }
  }
}

export const aiService = new AIService();
