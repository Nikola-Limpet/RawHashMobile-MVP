import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FileAudio, Mic, Settings } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateIcon = 'mic' | 'audio' | 'settings';

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const icons = {
  mic: Mic,
  audio: FileAudio,
  settings: Settings,
};

export function EmptyState({
  icon = 'mic',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className={cn('flex-1 items-center justify-center p-8 gap-4', className)}
    >
      <View className="w-[72px] h-[72px] rounded-full bg-muted items-center justify-center mb-2">
        <Icon size={32} className="text-muted-foreground" color="#71717a" />
      </View>
      <Text className="text-lg font-semibold text-center text-foreground">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-center text-muted-foreground leading-5">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </Animated.View>
  );
}
