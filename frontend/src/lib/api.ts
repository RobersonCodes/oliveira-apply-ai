import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true, // access/refresh token vivem em cookies httpOnly, não em JS
  headers: { 'Content-Type': 'application/json' },
});

// csrfToken só existe em memória (nunca localStorage/cookie legível por JS) — vem no
// corpo da resposta de login/register/refresh/me e precisa ser ecoado como header em
// toda requisição que muda estado, provando que quem chamou leu uma resposta legítima
// da API (um site atacante não consegue, por causa do same-origin policy).
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

// Mantido pelo nome por compatibilidade com o restante do app — hoje só limpa o
// csrfToken em memória; os cookies de sessão são limpos pelo backend no /auth/logout.
export function clearTokens() {
  setCsrfToken(null);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
}

// Response interceptor — auto-refresh via cookie httpOnly (sem token nenhum em JS)
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, null, { withCredentials: true });
        setCsrfToken(data.data.csrfToken);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearTokens();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Erro desconhecido';
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  linkedinStatus: () => api.get('/auth/linkedin/status'),
  linkedinDisconnect: () => api.post('/auth/linkedin/disconnect'),
  linkedinImportProfile: () => api.post('/auth/linkedin/import-profile'),
};

export const automationApi = {
  list: () => api.get('/automations'),
  create: (data: any) => api.post('/automations', data),
  getById: (id: string) => api.get(`/automations/${id}`),
  update: (id: string, data: any) => api.put(`/automations/${id}`, data),
  delete: (id: string) => api.delete(`/automations/${id}`),
  start: (id: string) => api.post(`/automations/${id}/start`),
  stop: (id: string) => api.post(`/automations/${id}/stop`),
  getLogs: (id: string, params?: any) => api.get(`/automations/${id}/logs`, { params }),
  saveLinkedIn: (data: any) => api.post('/automations/linkedin/credentials', data),
};

export const resumeApi = {
  list: () => api.get('/resumes'),
  upload: (formData: FormData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  adapt: (data: any) => api.post('/resumes/adapt', data),
  generateCoverLetter: (data: any) => api.post('/resumes/cover-letter', data),
  analyzeMatch: (data: any) => api.post('/resumes/analyze-match', data),
  delete: (id: string) => api.delete(`/resumes/${id}`),
};

export const applicationApi = {
  list: (params?: any) => api.get('/applications', { params }),
  getStats: (params?: any) => api.get('/applications/stats', { params }),
  updateStatus: (id: string, data: any) => api.patch(`/applications/${id}/status`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  charts: () => api.get('/analytics/charts'),
  trend: (params?: any) => api.get('/analytics/trend', { params }),
};

export const billingApi = {
  createCheckout: (plan: string) => api.post('/billing/checkout', { plan }),
  createPortal: () => api.post('/billing/portal'),
  getSubscription: () => api.get('/billing/subscription'),
};

export const notificationApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (ids?: string[]) => api.post('/notifications/read', { ids }),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.post('/users/change-password', data),
  getUsage: () => api.get('/users/usage'),
};

export const onboardingApi = {
  getStatus: () => api.get('/onboarding/status'),
  complete: (data: {
    jobTitle: string;
    area?: string;
    minSalary?: number;
    workRegime?: string;
    city?: string;
    state?: string;
    remoteOnly?: boolean;
    autoApplyEnabled?: boolean;
    platforms?: string[];
  }) => api.post('/onboarding/complete', data),
  updatePreferences: (data: Partial<{
    jobTitle: string;
    area: string;
    minSalary: number;
    workRegime: string;
    city: string;
    state: string;
    remoteOnly: boolean;
    autoApplyEnabled: boolean;
    platforms: string[];
  }>) => api.put('/onboarding/preferences', data),
};
