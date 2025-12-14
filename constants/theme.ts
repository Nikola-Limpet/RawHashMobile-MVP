/**
 * Clean, minimal theme based on oklch color scheme
 * Converted to hex for React Native compatibility
 */

import { Platform } from 'react-native';

// Light theme colors (converted from oklch)
const lightColors = {
  background: '#FFFFFF',
  foreground: '#1C1C2E',
  card: '#FFFFFF',
  cardForeground: '#1C1C2E',
  primary: '#C46A3A', // oklch(0.6716 0.1368 48.5130) - warm orange/terracotta
  primaryForeground: '#FFFFFF',
  secondary: '#3D8B8B', // oklch(0.5360 0.0398 196.0280) - teal
  secondaryForeground: '#FFFFFF',
  muted: '#F5F5F7',
  mutedForeground: '#6B6B7B',
  accent: '#EBEBEB',
  accentForeground: '#1C1C2E',
  destructive: '#DC4A4A',
  destructiveForeground: '#FAFAFA',
  border: '#E5E5EA',
  input: '#E5E5EA',
  ring: '#C46A3A',
};

// Dark theme colors (converted from oklch)
const darkColors = {
  background: '#1A1A1F',
  foreground: '#C8C8C8',
  card: '#1E1E1E',
  cardForeground: '#C8C8C8',
  primary: '#4A9999', // oklch(0.5940 0.0443 196.0233) - teal
  primaryForeground: '#1A1A1F',
  secondary: '#4A9999',
  secondaryForeground: '#1A1A1F',
  muted: '#2A2A2A',
  mutedForeground: '#8B8B8B',
  accent: '#3A3A3A',
  accentForeground: '#C8C8C8',
  destructive: '#4A9999',
  destructiveForeground: '#1A1A1F',
  border: '#2A2A2A',
  input: '#2A2A2A',
  ring: '#D4935A', // oklch(0.7214 0.1337 49.9802) - warm accent
};

export const Colors = {
  light: {
    ...lightColors,
    text: lightColors.foreground,
    tint: lightColors.primary,
    icon: lightColors.mutedForeground,
    tabIconDefault: lightColors.mutedForeground,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    ...darkColors,
    text: darkColors.foreground,
    tint: darkColors.primary,
    icon: darkColors.mutedForeground,
    tabIconDefault: darkColors.mutedForeground,
    tabIconSelected: darkColors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Spacing system based on 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
};
