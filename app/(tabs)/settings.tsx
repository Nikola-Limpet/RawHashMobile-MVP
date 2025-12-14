import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Key, Sparkles, Info, HelpCircle, Check, AlertCircle, User, LogOut } from 'lucide-react-native';

import { GlassHeader, useTabBarHeight } from '@/components/ui/glass-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useApiKeyStore } from '@/stores/api-key-store';
import { GeminiService } from '@/services/gemini-service';
import { Colors } from '@/constants/theme';
import { Config } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();

  // User auth state
  const { user, signOut: authSignOut, isLoading: isAuthLoading } = useAuthStore();

  // API key state
  const { isDemoMode, apiKey, isEnvKey, setApiKey, clearApiKey, enterDemoMode, exitDemoMode } = useApiKeyStore();
  const isApiAuthenticated = isDemoMode || apiKey !== null;

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

      setApiKey(inputApiKey.trim());
      setInputApiKey('');
      Alert.alert('Success', 'API key saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  }, [inputApiKey, setApiKey]);

  const handleClearApiKey = useCallback(() => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearApiKey();
          },
        },
      ]
    );
  }, [clearApiKey]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await authSignOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }, [authSignOut]);

  const headerHeight = insets.top + 60;

  return (
    <View className="flex-1 bg-background">
      <GlassHeader title="Settings" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: headerHeight + 16,
          paddingBottom: tabBarHeight + 24,
          gap: 16,
        }}
      >
        {/* Account Section */}
        {user && (
          <Animated.View entering={FadeInDown.delay(0).duration(300)}>
            <Card variant="outline" animated={false}>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 rounded-full items-center justify-center bg-primary">
                    <User size={20} color={colors.primaryForeground} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{user.name}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {user.email}
                    </Text>
                  </View>
                </View>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  onPress={handleSignOut}
                  loading={isAuthLoading}
                  className="flex-1"
                >
                  <LogOut size={16} color={colors.foreground} />
                  <Text className="ml-2">Sign Out</Text>
                </Button>
              </CardFooter>
            </Card>
          </Animated.View>
        )}

        {/* Sign In Prompt */}
        {!user && (
          <Animated.View entering={FadeInDown.delay(0).duration(300)}>
            <Card variant="outline" animated={false}>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 rounded-md items-center justify-center bg-muted">
                    <User size={20} color={colors.mutedForeground} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">Account</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      Sign in to sync your data
                    </Text>
                  </View>
                </View>
              </CardHeader>
              <CardFooter>
                <Button onPress={() => router.push('/(auth)/login')} className="flex-1">
                  Sign In
                </Button>
              </CardFooter>
            </Card>
          </Animated.View>
        )}

        {/* Demo Mode Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Card variant="outline" animated={false}>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 rounded-md items-center justify-center bg-primary/15">
                  <Sparkles size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Demo Mode</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    Try the app without an API key
                  </Text>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              {isDemoMode ? (
                <View className="gap-1">
                  <View className="flex-row items-center self-start px-2 py-1 rounded-sm gap-1 bg-primary/20">
                    <Check size={14} color={colors.primary} />
                    <Text className="text-xs font-semibold text-primary">
                      Demo Mode Active
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Using simulated transcriptions
                  </Text>
                </View>
              ) : (
                <Text className="text-sm text-muted-foreground leading-5">
                  Experience the app with simulated transcriptions. No API key required.
                </Text>
              )}
            </CardContent>
            <CardFooter>
              {isDemoMode ? (
                <Button variant="outline" onPress={exitDemoMode} className="flex-1">
                  Exit Demo Mode
                </Button>
              ) : (
                <Button onPress={enterDemoMode} className="flex-1">
                  Enter Demo Mode
                </Button>
              )}
            </CardFooter>
          </Card>
        </Animated.View>

        {/* API Key Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Card variant="outline" animated={false}>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 rounded-md items-center justify-center bg-secondary/15">
                  <Key size={20} color={colors.secondary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Gemini API Key</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    Connect for real transcriptions
                  </Text>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              {apiKey ? (
                <View className="gap-2">
                  <View className="flex-row items-center self-start px-2 py-1 rounded-sm gap-1 bg-secondary/20">
                    <Check size={14} color={colors.secondary} />
                    <Text className="text-xs font-semibold text-secondary">
                      {isEnvKey ? 'Environment Variable' : 'API Key Connected'}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground font-mono">
                    {isEnvKey ? 'EXPO_PUBLIC_GEMINI_API_KEY' : `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  <TextInput
                    className={cn(
                      'rounded-md border p-2 text-sm text-foreground bg-muted',
                      error ? 'border-destructive' : 'border-border'
                    )}
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
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      className="flex-row items-center gap-1"
                    >
                      <AlertCircle size={14} color={colors.destructive} />
                      <Text className="text-xs text-destructive flex-1">{error}</Text>
                    </Animated.View>
                  )}
                </View>
              )}
            </CardContent>
            <CardFooter>
              {apiKey ? (
                !isEnvKey && (
                  <Button variant="destructive" onPress={handleClearApiKey} className="flex-1">
                    Remove API Key
                  </Button>
                )
              ) : (
                <Button
                  onPress={handleSaveApiKey}
                  loading={isValidating}
                  disabled={!inputApiKey.trim()}
                  className="flex-1"
                >
                  Save API Key
                </Button>
              )}
            </CardFooter>
          </Card>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Card variant="outline" animated={false}>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 rounded-md items-center justify-center bg-muted">
                  <Info size={20} color={colors.mutedForeground} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">About</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    App information
                  </Text>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              <View>
                <View className="flex-row justify-between items-center py-2 border-b border-border">
                  <Text className="text-sm text-muted-foreground">Version</Text>
                  <Text className="text-sm font-medium text-foreground">1.0.0</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-border">
                  <Text className="text-sm text-muted-foreground">Model</Text>
                  <Text className="text-sm font-medium text-foreground">{Config.gemini.model}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-sm text-muted-foreground">Status</Text>
                  <View className={cn(
                    'flex-row items-center px-2 py-1 rounded-sm gap-1',
                    isDemoMode ? 'bg-primary/20' : isApiAuthenticated ? 'bg-secondary/20' : 'bg-muted'
                  )}>
                    <View className={cn(
                      'w-2 h-2 rounded-full',
                      isDemoMode ? 'bg-primary' : isApiAuthenticated ? 'bg-secondary' : 'bg-muted-foreground'
                    )} />
                    <Text className={cn(
                      'text-xs font-medium',
                      isDemoMode ? 'text-primary' : isApiAuthenticated ? 'text-secondary' : 'text-muted-foreground'
                    )}>
                      {isDemoMode ? 'Demo' : isApiAuthenticated ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </Animated.View>

        {/* Help Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <Card variant="outline" animated={false}>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 rounded-md items-center justify-center bg-muted">
                  <HelpCircle size={20} color={colors.mutedForeground} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Getting Started</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    Quick guide
                  </Text>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              <View className="gap-2">
                {[
                  'Get your API key from Google AI Studio',
                  'Enter your API key above',
                  'Use Live tab for quick transcriptions',
                  'Use Record tab for fine-tuned context',
                ].map((text, index) => (
                  <View key={index} className="flex-row items-start gap-2">
                    <View className="w-6 h-6 rounded-full items-center justify-center bg-primary/15">
                      <Text className="text-xs font-semibold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm text-muted-foreground leading-5 pt-0.5">
                      {text}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
