import { z } from 'zod';

export const RegisterDto = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional().default('FREE'),
});

export const LoginDto = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
});

export const ResetPasswordDto = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export const UpdateProfileDto = z.object({
  name: z.string().min(2).max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  targetRole: z.string().max(100).optional(),
  targetSalary: z.number().positive().optional(),
  skills: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
