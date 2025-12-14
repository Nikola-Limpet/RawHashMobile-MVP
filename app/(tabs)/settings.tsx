import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { GeminiService } from '@/services/gemini-service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Config } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isDemoMode, isAuthenticated, apiKey, isEnvKey, setApiKey, clearApiKey, enterDemoMode, exitDemoMode } = useAuth();

  const [inputApiKey, setInputApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveApiKey = useCallback(async () => {
    if (!inputApiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const geminiService = new GeminiService(inputApiKey.trim());
      const isValid = await geminiService.validateApiKey();

      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        return;
      }

      await setApiKey(inputApiKey.trim());
      setInputApiKey('');
      Alert.alert('Success', 'API key saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  }, [inputApiKey, setApiKey]);

  const handleClearApiKey = useCallback(async () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearApiKey();
          },
        },
      ]
    );
  }, [clearApiKey]);

  const handleEnterDemoMode = useCallback(() => {
    enterDemoMode();
  }, [enterDemoMode]);

  const handleExitDemoMode = useCallback(() => {
    exitDemoMode();
  }, [exitDemoMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Demo Mode Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Demo Mode</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Try the app without an API key. Uses simulated transcriptions.
          </ThemedText>

          {isDemoMode ? (
            <View style={styles.demoActiveContainer}>
              <View style={[styles.demoActiveBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText style={[styles.demoActiveText, { color: colors.primary }]}>
                  Demo Mode Active
                </ThemedText>
              </View>
              <Pressable
                onPress={handleExitDemoMode}
                style={[styles.button, { backgroundColor: colors.muted }]}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  Exit Demo Mode
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleEnterDemoMode}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Enter Demo Mode
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* API Key Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Gemini API Key</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Connect your Gemini API key for real transcriptions using Gemini Flash 2.5.
          </ThemedText>

          {apiKey ? (
            <View style={styles.apiKeyConnectedContainer}>
              <View style={[styles.connectedBadge, { backgroundColor: colors.secondary + '20' }]}>
                <View style={[styles.connectedDot, { backgroundColor: colors.secondary }]} />
                <ThemedText style={[styles.connectedText, { color: colors.secondary }]}>
                  {isEnvKey ? 'Using Environment Variable' : 'API Key Connected'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.apiKeyPreview, { color: colors.mutedForeground }]}>
                {isEnvKey ? 'EXPO_PUBLIC_GEMINI_API_KEY' : `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`}
              </ThemedText>
              {!isEnvKey && (
                <Pressable
                  onPress={handleClearApiKey}
                  style={[styles.button, { backgroundColor: colors.destructive + '15' }]}
                >
                  <ThemedText style={[styles.buttonText, { color: colors.destructive }]}>
                    Remove API Key
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.apiKeyInputContainer}>
              <TextInput
                style={[
                  styles.apiKeyInput,
                  {
                    backgroundColor: colors.muted,
                    color: colors.text,
                    borderColor: error ? colors.destructive : colors.border,
                  },
                ]}
                placeholder="Enter your Gemini API key"
                placeholderTextColor={colors.mutedForeground}
                value={inputApiKey}
                onChangeText={(text) => {
                  setInputApiKey(text);
                  setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error && (
                <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                  {error}
                </ThemedText>
              )}
              <Pressable
                onPress={handleSaveApiKey}
                disabled={isValidating || !inputApiKey.trim()}
                style={[
                  styles.button,
                  {
                    backgroundColor: isValidating || !inputApiKey.trim()
                      ? colors.muted
                      : colors.primary,
                  },
                ]}
              >
                {isValidating ? (
                  <ActivityIndicator color={colors.mutedForeground} size="small" />
                ) : (
                  <ThemedText
                    style={[
                      styles.buttonText,
                      {
                        color: !inputApiKey.trim()
                          ? colors.mutedForeground
                          : colors.primaryForeground,
                      },
                    ]}
                  >
                    Save API Key
                  </ThemedText>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <View style={styles.aboutRow}>
            <ThemedText style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              Version
            </ThemedText>
            <ThemedText>1.0.0</ThemedText>
          </View>
          <View style={styles.aboutRow}>
            <ThemedText style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              Model
            </ThemedText>
            <ThemedText>{Config.gemini.model}</ThemedText>
          </View>
          <View style={styles.aboutRow}>
            <ThemedText style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              Status
            </ThemedText>
            <ThemedText>
              {isDemoMode ? 'Demo Mode' : isAuthenticated ? 'Connected' : 'Not Connected'}
            </ThemedText>
          </View>
        </View>

        {/* Help Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
          <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
            1. Get your API key from Google AI Studio{'\n'}
            2. Enter your API key above{'\n'}
            3. Use the Live tab for quick transcriptions{'\n'}
            4. Use the Record tab to save and transcribe later{'\n'}
            5. Add context in the Record tab for better accuracy
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  demoActiveContainer: {
    gap: Spacing.sm,
  },
  demoActiveBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  demoActiveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  apiKeyConnectedContainer: {
    gap: Spacing.sm,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  apiKeyPreview: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  apiKeyInputContainer: {
    gap: Spacing.sm,
  },
  apiKeyInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  aboutLabel: {
    fontSize: 14,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
