import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Config, hasEnvApiKey } from '@/constants/config';

// Custom storage adapter for SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

interface ApiKeyState {
  apiKey: string | null;
  isEnvKey: boolean;
  isDemoMode: boolean;
}

interface ApiKeyActions {
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

interface ApiKeyComputed {
  isAuthenticated: boolean;
}

const getInitialState = (): ApiKeyState => {
  const envKey = hasEnvApiKey() ? Config.gemini.apiKey : null;
  return {
    apiKey: envKey,
    isEnvKey: Boolean(envKey),
    isDemoMode: false,
  };
};

export const useApiKeyStore = create<ApiKeyState & ApiKeyActions & ApiKeyComputed>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // Computed - check if state exists during rehydration
      get isAuthenticated() {
        const state = get();
        if (!state) return false;
        return state.isDemoMode || state.apiKey !== null;
      },

      setApiKey: (key) => {
        set({
          apiKey: key,
          isEnvKey: false,
          isDemoMode: false,
        });
      },

      clearApiKey: () => {
        const envKey = hasEnvApiKey() ? Config.gemini.apiKey : null;
        set({
          apiKey: envKey,
          isEnvKey: Boolean(envKey),
        });
      },

      enterDemoMode: () => {
        set({ isDemoMode: true });
      },

      exitDemoMode: () => {
        set({ isDemoMode: false });
      },
    }),
    {
      name: 'rawhash-api-key',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        apiKey: state.isEnvKey ? null : state.apiKey,
        isDemoMode: state.isDemoMode,
      }),
    }
  )
);

// Selector for computed isAuthenticated
export const selectIsAuthenticated = (state: ApiKeyState & ApiKeyActions & ApiKeyComputed) =>
  state.isDemoMode || state.apiKey !== null;
