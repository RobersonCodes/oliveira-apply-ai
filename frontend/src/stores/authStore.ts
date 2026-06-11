'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setTokens, clearTokens } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  subscription?: {
    plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
    status: string;
  };
  profile?: {
    jobTitle?: string;
    location?: string;
    avatarUrl?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ email, password });
          const { accessToken, refreshToken, user } = data.data;
          setTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const msg = error.response?.data?.message || 'Falha ao fazer login';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.register(formData);
          const { accessToken, refreshToken, user } = data.data;
          setTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const msg = error.response?.data?.message || 'Falha ao criar conta';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {
          // ignore
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchMe: async () => {
        if (!localStorage.getItem('accessToken')) return;
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data.data, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
