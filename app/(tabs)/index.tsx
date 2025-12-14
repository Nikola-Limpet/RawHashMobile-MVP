import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { Mic, Square } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioRecording, formatDuration, normalizeMetering } from '@/services/audio-service';
import { GeminiService, getDemoTranscription } from '@/services/gemini-service';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export default function LiveTranscriptionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isDemoMode, apiKey } = useAuth();

  const {
    recordingState,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
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

      // Start pulse animation
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

      // Stop animations
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(0.3);
      recordingScale.value = withSpring(1);

      const uri = await stopRecording();

      if (!uri) {
        throw new Error('No recording available');
      }

      let transcription;

      if (isDemoMode) {
        // Simulate processing delay in demo mode
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

  const metering = normalizeMetering(recordingState.metering);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Live</ThemedText>
        {isDemoMode && (
          <View style={[styles.demoBadge, { backgroundColor: colors.muted }]}>
            <ThemedText style={[styles.demoText, { color: colors.mutedForeground }]}>
              Demo
            </ThemedText>
          </View>
        )}
      </ThemedView>

      <ScrollView
        style={styles.transcriptContainer}
        contentContainerStyle={styles.transcriptContent}
      >
        {isProcessing && (
          <View style={[styles.processingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <ThemedText style={[styles.processingText, { color: colors.mutedForeground }]}>
              Transcribing...
            </ThemedText>
          </View>
        )}

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.destructive + '15' }]}>
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {transcripts.length === 0 && !isProcessing && !error && (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the record button to start transcribing
            </ThemedText>
          </View>
        )}

        {transcripts.map((entry) => (
          <View
            key={entry.id}
            style={[styles.transcriptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ThemedText style={styles.transcriptText}>{entry.text}</ThemedText>
            <ThemedText style={[styles.timestamp, { color: colors.mutedForeground }]}>
              {entry.timestamp.toLocaleTimeString()}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.controlsContainer}>
        {recordingState.isRecording && (
          <View style={styles.durationContainer}>
            <View style={[styles.meteringBar, { backgroundColor: colors.muted }]}>
              <Animated.View
                style={[
                  styles.meteringFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${metering * 100}%`,
                  },
                ]}
              />
            </View>
            <ThemedText style={[styles.duration, { color: colors.mutedForeground }]}>
              {formatDuration(recordingState.duration)}
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={recordingState.isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
        >
          <View style={styles.recordButtonContainer}>
            <Animated.View
              style={[
                styles.recordButtonPulse,
                { backgroundColor: colors.primary },
                animatedPulseStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.recordButton,
                { backgroundColor: recordingState.isRecording ? colors.destructive : colors.primary },
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

        <ThemedText style={[styles.hint, { color: colors.mutedForeground }]}>
          {recordingState.isRecording ? 'Tap to stop' : 'Tap to record'}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 28,
  },
  demoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transcriptContainer: {
    flex: 1,
  },
  transcriptContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  processingText: {
    fontSize: 14,
  },
  errorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  transcriptCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 12,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  durationContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  meteringBar: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  meteringFill: {
    height: '100%',
    borderRadius: 2,
  },
  duration: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonPulse: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 14,
  },
});
