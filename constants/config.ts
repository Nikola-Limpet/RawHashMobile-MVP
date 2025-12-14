/**
 * App configuration using environment variables
 *
 * Environment variables must be prefixed with EXPO_PUBLIC_ to be accessible
 * in the client-side code.
 */

export const Config = {
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    model: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta',
  },
} as const;

export function hasEnvApiKey(): boolean {
  return Boolean(Config.gemini.apiKey);
}
