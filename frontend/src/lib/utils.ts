import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return formatDate(date);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function truncate(str: string, maxLength = 50): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Candidatou',
  VIEWED: 'Visualizado',
  INTERVIEW_SCHEDULED: 'Entrevista',
  OFFER_RECEIVED: 'Oferta',
  REJECTED: 'Rejeitado',
  WITHDRAWN: 'Retirado',
  GHOSTED: 'Sem resposta',
};

export const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'badge-info',
  VIEWED: 'badge-purple',
  INTERVIEW_SCHEDULED: 'badge-warning',
  OFFER_RECEIVED: 'badge-success',
  REJECTED: 'badge-danger',
  WITHDRAWN: 'badge-default',
  GHOSTED: 'badge-default',
};

export const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
