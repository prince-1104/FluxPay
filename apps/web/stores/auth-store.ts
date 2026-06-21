import { create } from 'zustand';
import type { AuthUser } from '@settl/types';
import {
  api,
  clearSession,
  ensureValidSession,
  getApiError,
  getStoredUser,
  loadStoredTokens,
  onSessionExpired,
  setStoredUser,
  setTokens,
} from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; username: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    loadStoredTokens();
    if (!getStoredUser()) {
      set({ user: null, isInitialized: true });
      return;
    }

    set({ isLoading: true });
    const user = await ensureValidSession();
    set({ user, isLoading: false, isInitialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setTokens(data.data.tokens);
      setStoredUser(data.data.user);
      set({ user: data.data.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getApiError(error));
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', input);
      setTokens(data.data.tokens);
      setStoredUser(data.data.user);
      set({ user: data.data.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getApiError(error));
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearSession();
    set({ user: null });
  },
}));

if (typeof window !== 'undefined') {
  onSessionExpired(() => {
    useAuthStore.setState({ user: null });
  });
}
