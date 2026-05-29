import { z } from 'zod';

export const CreateAutomationDto = z.object({
  name: z.string().min(1).max(100).default('Nova Automação'),
  keywords: z.array(z.string().min(1)).min(1, 'Adicione ao menos uma palavra-chave'),
  location: z.string().optional(),
  remoteOnly: z.boolean().default(false),
  easyApplyOnly: z.boolean().default(true),
  seniorityLevels: z
    .array(z.enum(['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE']))
    .default(['JUNIOR', 'MID', 'SENIOR']),
  jobTypes: z
    .array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY']))
    .default(['FULL_TIME']),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  requiredSkills: z.array(z.string()).default([]),
  excludedCompanies: z.array(z.string()).default([]),
  excludedKeywords: z.array(z.string()).default([]),
  maxApplications: z.number().int().positive().max(500).default(50),
  dailyLimit: z.number().int().positive().max(100).default(20),
  minMatchScore: z.number().min(0).max(100).default(70),
  generateCoverLetter: z.boolean().default(true),
  adaptResume: z.boolean().default(true),
  minDelaySeconds: z.number().int().min(1).max(30).default(3),
  maxDelaySeconds: z.number().int().min(5).max(120).default(15),
  platforms: z.array(z.enum(['LINKEDIN', 'INDEED', 'GLASSDOOR', 'GUPY', 'CATHO'])).default(['LINKEDIN']),
});

export const UpdateAutomationDto = CreateAutomationDto.partial();

export const LinkedInCredentialsDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorSecret: z.string().optional(),
});

export type CreateAutomationDtoType = z.infer<typeof CreateAutomationDto>;
export type LinkedInCredentialsDtoType = z.infer<typeof LinkedInCredentialsDto>;
