import { create } from 'zustand';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to sign in');
      }

      if (response.data) {
        set({
          user: response.data.user as User,
          session: { token: response.data.token } as Session,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to sign up');
      }

      if (response.data) {
        set({
          user: response.data.user as User,
          session: { token: response.data.token } as Session,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authClient.signOut();
      set({
        user: null,
        session: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign out',
        isLoading: false,
      });
    }
  },

  refreshSession: async () => {
    set({ isLoading: true });
    try {
      const response = await authClient.getSession();
      if (response.data) {
        set({
          user: response.data.user as User,
          session: response.data.session as Session,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          session: null,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        session: null,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
