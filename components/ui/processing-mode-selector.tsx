import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  FileText,
  Sparkles,
  FileMinusIcon,
  List,
  Briefcase,
  Scissors,
} from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProcessingMode, PROCESSING_MODE_LABELS } from '@/services/gemini-service';

interface ProcessingModeSelectorProps {
  selected: ProcessingMode;
  onSelect: (mode: ProcessingMode) => void;
  compact?: boolean;
  className?: string;
}

const ICONS: Record<ProcessingMode, React.ElementType> = {
  raw: FileText,
  clean: Sparkles,
  summary: FileMinusIcon,
  keypoints: List,
  professional: Briefcase,
  concise: Scissors,
};

const MODES: ProcessingMode[] = ['raw', 'clean', 'summary', 'keypoints', 'professional', 'concise'];

export function ProcessingModeSelector({
  selected,
  onSelect,
  compact = false,
  className,
}: ProcessingModeSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-1 py-1"
        className={className}
      >
        {MODES.map((mode) => {
          const Icon = ICONS[mode];
          const isSelected = selected === mode;
          const info = PROCESSING_MODE_LABELS[mode];

          return (
            <Pressable
              key={mode}
              onPress={() => onSelect(mode)}
              className={cn(
                'flex-row items-center py-1 px-2 rounded-full border gap-1',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-muted border-border'
              )}
            >
              <Icon
                size={16}
                color={isSelected ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                )}
              >
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} className={cn('gap-2', className)}>
      <Text className="text-xs font-medium text-muted-foreground mb-1">
        Processing Mode
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {MODES.map((mode) => {
          const Icon = ICONS[mode];
          const isSelected = selected === mode;
          const info = PROCESSING_MODE_LABELS[mode];

          return (
            <Pressable
              key={mode}
              onPress={() => onSelect(mode)}
              className={cn(
                'flex-row items-center py-2 px-2 rounded-md border w-[48%] gap-2',
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted border-border'
              )}
            >
              <View
                className={cn(
                  'w-8 h-8 rounded-sm items-center justify-center',
                  isSelected ? 'bg-primary' : 'bg-background'
                )}
              >
                <Icon
                  size={18}
                  color={isSelected ? colors.primaryForeground : colors.mutedForeground}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={cn(
                    'text-[13px] font-semibold',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {info.label}
                </Text>
                <Text
                  className="text-[10px] text-muted-foreground mt-[1px]"
                  numberOfLines={1}
                >
                  {info.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

interface ProcessingResultViewProps {
  mode: ProcessingMode;
  processed: string;
  summary?: string;
  keyPoints?: string[];
  original?: string;
  showOriginal?: boolean;
  className?: string;
}

export function ProcessingResultView({
  mode,
  processed,
  summary,
  keyPoints,
  original,
  showOriginal = false,
  className,
}: ProcessingResultViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View className={cn('gap-4', className)}>
      {showOriginal && original && original !== processed && (
        <View className="gap-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Original
          </Text>
          <View className="p-2 rounded-md bg-muted">
            <Text className="text-sm leading-[22px] text-muted-foreground">
              {original}
            </Text>
          </View>
        </View>
      )}

      {mode === 'summary' && summary ? (
        <>
          <View className="gap-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Transcription
            </Text>
            <View className="p-2 rounded-md bg-muted">
              <Text className="text-sm leading-[22px] text-foreground">{processed}</Text>
            </View>
          </View>
          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <FileMinusIcon size={14} color={colors.primary} />
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Summary
              </Text>
            </View>
            <View className="p-2 rounded-md bg-primary/10 border border-primary/30">
              <Text className="text-sm leading-[22px] text-foreground">{summary}</Text>
            </View>
          </View>
        </>
      ) : mode === 'keypoints' && keyPoints && keyPoints.length > 0 ? (
        <>
          <View className="gap-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Transcription
            </Text>
            <View className="p-2 rounded-md bg-muted">
              <Text className="text-sm leading-[22px] text-foreground">{processed}</Text>
            </View>
          </View>
          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <List size={14} color={colors.primary} />
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Key Points
              </Text>
            </View>
            <View className="p-2 rounded-md bg-primary/10 border border-primary/30 gap-2">
              {keyPoints.map((point, index) => (
                <View key={index} className="flex-row items-start gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary mt-[7px]" />
                  <Text className="flex-1 text-sm leading-5 text-foreground">{point}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View className="p-2 rounded-md bg-muted">
          <Text className="text-sm leading-[22px] text-foreground">{processed}</Text>
        </View>
      )}
    </View>
  );
}
