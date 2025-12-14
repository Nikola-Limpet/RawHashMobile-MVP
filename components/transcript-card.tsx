import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Copy, Check, Trash2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useState, useCallback } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TranscriptCardProps {
  id: string;
  text: string;
  timestamp: Date;
  title?: string;
  subtitle?: string;
  onDelete?: (id: string) => void;
  index?: number;
}

export function TranscriptCard({
  id,
  text,
  timestamp,
  title,
  subtitle,
  onDelete,
  index = 0,
}: TranscriptCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleDelete = useCallback(() => {
    onDelete?.(id);
  }, [id, onDelete]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      exiting={FadeOut.duration(200)}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <View className="flex-row justify-between items-start p-4 pb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {title || timestamp.toLocaleTimeString()}
          </Text>
          {subtitle && (
            <Text className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
        <View className="flex-row gap-1">
          <Pressable
            onPress={handleCopy}
            className="p-1 rounded-sm bg-muted"
          >
            {copied ? (
              <Check size={14} color={colors.primary} />
            ) : (
              <Copy size={14} color={colors.mutedForeground} />
            )}
          </Pressable>
          {onDelete && (
            <Pressable
              onPress={handleDelete}
              className="p-1 rounded-sm bg-destructive/15"
            >
              <Trash2 size={14} color={colors.destructive} />
            </Pressable>
          )}
        </View>
      </View>
      <View className="mx-4 mb-4 p-2 rounded-md bg-muted">
        <Text className="text-sm leading-[22px] text-foreground">{text}</Text>
      </View>
    </Animated.View>
  );
}
