import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignupScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignup = useCallback(async () => {
    if (!name.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    if (!password) {
      setLocalError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setLocalError(null);
    clearError();

    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (err) {
      // Error is handled by the store
    }
  }, [name, email, password, confirmPassword, signUp, clearError]);

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(300)} className="flex-1 justify-center">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">Create account</Text>
            <Text className="text-base text-muted-foreground">
              Sign up to start using RawHash
            </Text>
          </Animated.View>

          {/* Error Message */}
          {displayError && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="flex-row items-center gap-2 p-4 rounded-lg bg-destructive/15 mb-4"
            >
              <AlertCircle size={18} color={colors.destructive} />
              <Text className="text-sm text-destructive flex-1">{displayError}</Text>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} className="gap-4">
            {/* Name Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Name</Text>
              <View className="flex-row items-center border border-border rounded-lg bg-muted px-3">
                <User size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 py-3 px-2 text-base text-foreground"
                  placeholder="Enter your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setLocalError(null);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Email</Text>
              <View className="flex-row items-center border border-border rounded-lg bg-muted px-3">
                <Mail size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 py-3 px-2 text-base text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setLocalError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <View className="flex-row items-center border border-border rounded-lg bg-muted px-3">
                <Lock size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 py-3 px-2 text-base text-foreground"
                  placeholder="Create a password (min 8 chars)"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setLocalError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Confirm Password</Text>
              <View className="flex-row items-center border border-border rounded-lg bg-muted px-3">
                <Lock size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 py-3 px-2 text-base text-foreground"
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setLocalError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Button
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              className="mt-4"
            >
              Create Account
            </Button>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            className="flex-row justify-center items-center mt-6 gap-1"
          >
            <Text className="text-sm text-muted-foreground">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-primary">Sign In</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
