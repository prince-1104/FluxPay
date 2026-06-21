import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser, AuthTokens } from '@settl/types';
import { apiRequest, setTokens } from '../lib/api';

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; username: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const tokensRaw = await SecureStore.getItemAsync('settl_tokens');
        const userRaw = await SecureStore.getItemAsync('settl_user');
        if (tokensRaw && userRaw) {
          const tokens = JSON.parse(tokensRaw) as AuthTokens;
          setTokens(tokens.accessToken, tokens.refreshToken);
          setUser(JSON.parse(userRaw));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persistAuth(authUser: AuthUser, tokens: AuthTokens) {
    setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(authUser);
    await SecureStore.setItemAsync('settl_tokens', JSON.stringify(tokens));
    await SecureStore.setItemAsync('settl_user', JSON.stringify(authUser));
  }

  async function login(email: string, password: string) {
    const result = await apiRequest<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await persistAuth(result.user, result.tokens);
  }

  async function register(data: { email: string; password: string; name: string; username: string }) {
    const result = await apiRequest<{ user: AuthUser; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await persistAuth(result.user, result.tokens);
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setTokens(null, null);
    setUser(null);
    await SecureStore.deleteItemAsync('settl_tokens');
    await SecureStore.deleteItemAsync('settl_user');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
