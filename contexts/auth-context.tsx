import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Config, hasEnvApiKey } from '@/constants/config';

interface AuthState {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  apiKey: string | null;
  isEnvKey: boolean; // true if using env variable key
}

interface AuthContextType extends AuthState {
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_KEY_STORAGE_KEY = 'gemini_api_key';

// For web platform, use localStorage as fallback
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize with env key if available
    const envKey = hasEnvApiKey() ? Config.gemini.apiKey : null;
    return {
      isAuthenticated: Boolean(envKey),
      isDemoMode: false,
      apiKey: envKey,
      isEnvKey: Boolean(envKey),
    };
  });

  const setApiKey = useCallback(async (key: string) => {
    await storage.setItem(API_KEY_STORAGE_KEY, key);
    setState((prev) => ({
      ...prev,
      apiKey: key,
      isAuthenticated: true,
      isDemoMode: false,
      isEnvKey: false,
    }));
  }, []);

  const clearApiKey = useCallback(async () => {
    await storage.deleteItem(API_KEY_STORAGE_KEY);
    // Fall back to env key if available
    const envKey = hasEnvApiKey() ? Config.gemini.apiKey : null;
    setState((prev) => ({
      ...prev,
      apiKey: envKey,
      isAuthenticated: Boolean(envKey),
      isEnvKey: Boolean(envKey),
    }));
  }, []);

  const enterDemoMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDemoMode: true,
      isAuthenticated: true,
    }));
  }, []);

  const exitDemoMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDemoMode: false,
      isAuthenticated: prev.apiKey !== null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setApiKey,
        clearApiKey,
        enterDemoMode,
        exitDemoMode,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
