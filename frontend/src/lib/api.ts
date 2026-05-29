import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Response interceptor — auto-refresh token
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        processQueue(error);
        isRefreshing = false;
        clearTokens();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
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

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Erro desconhecido';
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}

// API helpers
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
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
