import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  className,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      className={cn('bg-muted overflow-hidden', className)}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: `${number}%`;
  lineHeight?: number;
  gap?: number;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  lineHeight = 16,
  gap = 8,
  className,
}: SkeletonTextProps) {
  return (
    <View className={cn('w-full', className)} style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  hasHeader?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({ hasHeader = true, lines = 2, className }: SkeletonCardProps) {
  return (
    <View className={cn('p-4 rounded-lg border border-border bg-card gap-3', className)}>
      {hasHeader && (
        <View className="flex-row justify-between items-center">
          <Skeleton width={120} height={18} />
          <Skeleton width={60} height={14} />
        </View>
      )}
      <SkeletonText lines={lines} />
    </View>
  );
}

interface SkeletonRecordingProps {
  count?: number;
  className?: string;
}

export function SkeletonRecording({ count = 2, className }: SkeletonRecordingProps) {
  return (
    <View className={cn('gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="p-4 rounded-lg border border-border bg-card gap-4"
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Skeleton width={180} height={18} />
              <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={32} height={32} borderRadius={6} />
          </View>
          <Skeleton width="100%" height={40} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}
