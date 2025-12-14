import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Mic, Square, X } from 'lucide-react-native';

import { GlassHeader, useTabBarHeight } from '@/components/ui/glass-header';
import { TranscriptCard } from '@/components/transcript-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAudioRecording, formatDuration, normalizeMetering } from '@/services/audio-service';
import { GeminiService, getDemoTranscription } from '@/services/gemini-service';
import { useApiKeyStore } from '@/stores/api-key-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export default function LiveTranscriptionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { isDemoMode, apiKey } = useApiKeyStore();

  const {
    recordingState,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordingScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  const animatedRecordStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      await startRecording();

      pulseOpacity.value = withRepeat(
        withTiming(0.8, { duration: 1000 }),
        -1,
        true
      );
      recordingScale.value = withSpring(1.1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [startRecording, pulseOpacity, recordingScale]);

  const handleStopRecording = useCallback(async () => {
    try {
      setIsProcessing(true);

      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(0.3);
      recordingScale.value = withSpring(1);

      const uri = await stopRecording();

      if (!uri) {
        throw new Error('No recording available');
      }

      let transcription;

      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        transcription = getDemoTranscription();
      } else if (apiKey) {
        const geminiService = new GeminiService(apiKey);
        transcription = await geminiService.transcribeAudio(uri);
      } else {
        throw new Error('No API key configured');
      }

      const newEntry: TranscriptEntry = {
        id: Date.now().toString(),
        text: transcription.text,
        timestamp: new Date(),
      };

      setTranscripts(prev => [newEntry, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transcribe');
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, isDemoMode, apiKey, pulseOpacity, recordingScale]);

  const handleDeleteTranscript = useCallback((id: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const metering = normalizeMetering(recordingState.metering);
  const headerHeight = insets.top + 60;

  return (
    <View className="flex-1 bg-background">
      <GlassHeader
        title="Live"
        rightElement={
          isDemoMode ? (
            <View className="px-2 py-1 rounded-sm bg-muted">
              <Text className="text-xs font-medium text-muted-foreground">Demo</Text>
            </View>
          ) : null
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: headerHeight + 16,
          paddingBottom: tabBarHeight + 120,
          gap: 16,
          ...(transcripts.length === 0 && !isProcessing && !error ? { flex: 1 } : {}),
        }}
      >
        {error && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-row items-center justify-between p-4 rounded-lg bg-destructive/15"
          >
            <Text className="text-sm text-destructive flex-1 mr-2">{error}</Text>
            <Pressable onPress={handleDismissError} hitSlop={8}>
              <X size={18} color={colors.destructive} />
            </Pressable>
          </Animated.View>
        )}

        {isProcessing && <SkeletonCard hasHeader lines={2} />}

        {transcripts.length === 0 && !isProcessing && !error && (
          <EmptyState
            icon="mic"
            title="No transcripts yet"
            description="Tap the record button below to start transcribing your voice in real-time"
          />
        )}

        {transcripts.map((entry, index) => (
          <TranscriptCard
            key={entry.id}
            id={entry.id}
            text={entry.text}
            timestamp={entry.timestamp}
            onDelete={handleDeleteTranscript}
            index={index}
          />
        ))}
      </ScrollView>

      <View
        className="absolute left-0 right-0 items-center py-6 px-6 gap-4"
        style={{ bottom: tabBarHeight }}
      >
        {recordingState.isRecording && (
          <Animated.View
            entering={FadeIn.duration(200)}
            className="items-center gap-2 w-full"
          >
            <View className="w-[60%] h-1 rounded-sm bg-muted overflow-hidden">
              <Animated.View
                className="h-full rounded-sm bg-primary"
                style={{ width: `${metering * 100}%` }}
              />
            </View>
            <Text className="text-sm text-muted-foreground tabular-nums">
              {formatDuration(recordingState.duration)}
            </Text>
          </Animated.View>
        )}

        <Pressable
          onPress={recordingState.isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          style={isProcessing ? { opacity: 0.5 } : undefined}
        >
          <View className="items-center justify-center">
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: colors.primary,
                },
                animatedPulseStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: recordingState.isRecording ? colors.destructive : colors.primary,
                },
                animatedRecordStyle,
              ]}
            >
              {recordingState.isRecording ? (
                <Square size={24} color={colors.primaryForeground} fill={colors.primaryForeground} />
              ) : (
                <Mic size={28} color={colors.primaryForeground} />
              )}
            </Animated.View>
          </View>
        </Pressable>

        <Text className="text-sm text-muted-foreground">
          {isProcessing
            ? 'Processing...'
            : recordingState.isRecording
            ? 'Tap to stop'
            : 'Tap to record'}
        </Text>
      </View>
    </View>
  );
}
