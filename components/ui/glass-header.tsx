import { View, Text, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

interface GlassHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function GlassHeader({ title, rightElement, className }: GlassHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const headerContent = (
    <View
      className="flex-row items-center justify-between px-6 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Text className="text-[28px] font-bold text-foreground">{title}</Text>
      {rightElement && (
        <View className="flex-row items-center">{rightElement}</View>
      )}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        className={cn('absolute top-0 left-0 right-0 z-[100] border-b border-border/40', className)}
        style={styles.hairlineBorder}
      >
        {headerContent}
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View
      className={cn(
        'absolute top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 shadow',
        className
      )}
      style={[styles.hairlineBorder, { paddingTop: insets.top }]}
    >
      {headerContent}
    </View>
  );
}

export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? 49 + insets.bottom : 56;
}

const styles = StyleSheet.create({
  hairlineBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
