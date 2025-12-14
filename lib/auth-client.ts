import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

// Get the base URL from environment or use default
const getBaseURL = () => {
  // In development, use the local server
  if (__DEV__) {
    // For physical devices, you may need to use your computer's IP
    return 'http://localhost:8081';
  }
  // In production, use your deployed API URL
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    expoClient({
      scheme: 'rawhash',
      storagePrefix: 'rawhash',
      storage: SecureStore,
    }),
  ],
});

// Export typed hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
