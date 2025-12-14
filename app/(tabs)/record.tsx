import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
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
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Trash2, Play, Pause, Mic, Square } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioRecording, formatDuration, normalizeMetering } from '@/services/audio-service';
import { GeminiService, getDemoTranscription, getMimeType } from '@/services/gemini-service';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Recording {
  id: string;
  uri: string;
  duration: number;
  transcript: string | null;
  isTranscribing: boolean;
  timestamp: Date;
  name?: string;
  mimeType?: string;
}

export default function RecordTranscribeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isDemoMode, apiKey } = useAuth();

  const {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecording();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [context, setContext] = useState('');
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
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(0.3);
      recordingScale.value = withSpring(1);

      const uri = await stopRecording();

      if (!uri) {
        throw new Error('No recording available');
      }

      const newRecording: Recording = {
        id: Date.now().toString(),
        uri,
        duration: recordingState.duration,
        transcript: null,
        isTranscribing: false,
        timestamp: new Date(),
      };

      setRecordings((prev) => [newRecording, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  }, [stopRecording, recordingState.duration, pulseOpacity, recordingScale]);

  const handleTranscribe = useCallback(async (recordingId: string) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    setRecordings((prev) =>
      prev.map((r) =>
        r.id === recordingId ? { ...r, isTranscribing: true } : r
      )
    );

    try {
      let transcription;

      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        transcription = getDemoTranscription();
      } else if (apiKey) {
        const geminiService = new GeminiService(apiKey);
        const mimeType = recording.mimeType || 'audio/wav';
        if (context.trim()) {
          transcription = await geminiService.transcribeWithContext(
            recording.uri,
            context.trim(),
            mimeType
          );
        } else {
          transcription = await geminiService.transcribeAudio(recording.uri, mimeType);
        }
      } else {
        throw new Error('No API key configured');
      }

      setRecordings((prev) =>
        prev.map((r) =>
          r.id === recordingId
            ? { ...r, transcript: transcription.text, isTranscribing: false }
            : r
        )
      );
    } catch (err) {
      setRecordings((prev) =>
        prev.map((r) =>
          r.id === recordingId ? { ...r, isTranscribing: false } : r
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to transcribe');
    }
  }, [recordings, isDemoMode, apiKey, context]);

  const handleDeleteRecording = useCallback((recordingId: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  }, []);

  const handleUploadAudio = useCallback(async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const mimeType = file.mimeType || getMimeType(file.name);

      const newRecording: Recording = {
        id: Date.now().toString(),
        uri: file.uri,
        duration: 0, // Unknown for uploaded files
        transcript: null,
        isTranscribing: false,
        timestamp: new Date(),
        name: file.name,
        mimeType,
      };

      setRecordings((prev) => [newRecording, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload audio');
    }
  }, []);

  const metering = normalizeMetering(recordingState.metering);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Record</ThemedText>
        {isDemoMode && (
          <View style={[styles.demoBadge, { backgroundColor: colors.muted }]}>
            <ThemedText style={[styles.demoText, { color: colors.mutedForeground }]}>
              Demo
            </ThemedText>
          </View>
        )}
      </ThemedView>

      <View style={[styles.contextContainer, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.contextLabel, { color: colors.mutedForeground }]}>
          Fine-tune Context (optional)
        </ThemedText>
        <TextInput
          style={[
            styles.contextInput,
            {
              backgroundColor: colors.muted,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g., Medical terminology, Technical jargon, Specific names..."
          placeholderTextColor={colors.mutedForeground}
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={2}
        />
      </View>

      <ScrollView
        style={styles.recordingsContainer}
        contentContainerStyle={styles.recordingsContent}
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.destructive + '15' }]}>
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {recordings.length === 0 && !recordingState.isRecording && (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Record audio or upload files to transcribe
            </ThemedText>
          </View>
        )}

        {recordings.map((recording) => (
          <View
            key={recording.id}
            style={[styles.recordingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.recordingHeader}>
              <View style={styles.recordingInfo}>
                <ThemedText style={styles.recordingTitle} numberOfLines={1}>
                  {recording.name || `Recording ${recording.timestamp.toLocaleTimeString()}`}
                </ThemedText>
                <ThemedText style={[styles.recordingDuration, { color: colors.mutedForeground }]}>
                  {recording.name ? recording.timestamp.toLocaleTimeString() : `Duration: ${formatDuration(recording.duration)}`}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => handleDeleteRecording(recording.id)}
                style={[styles.deleteButton, { backgroundColor: colors.destructive + '15' }]}
              >
                <Trash2 size={16} color={colors.destructive} />
              </Pressable>
            </View>

            {recording.transcript ? (
              <View style={[styles.transcriptBox, { backgroundColor: colors.muted }]}>
                <ThemedText style={styles.transcriptText}>
                  {recording.transcript}
                </ThemedText>
              </View>
            ) : recording.isTranscribing ? (
              <View style={styles.transcribingContainer}>
                <ActivityIndicator color={colors.primary} size="small" />
                <ThemedText style={[styles.transcribingText, { color: colors.mutedForeground }]}>
                  Transcribing...
                </ThemedText>
              </View>
            ) : (
              <Pressable
                onPress={() => handleTranscribe(recording.id)}
                style={[styles.transcribeButton, { backgroundColor: colors.primary }]}
              >
                <ThemedText style={[styles.transcribeButtonText, { color: colors.primaryForeground }]}>
                  Transcribe
                </ThemedText>
              </Pressable>
            )}
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
                    backgroundColor: colors.secondary,
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

        <View style={styles.buttonRow}>
          {recordingState.isRecording ? (
            <Pressable
              onPress={recordingState.isPaused ? resumeRecording : pauseRecording}
              style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
            >
              {recordingState.isPaused ? (
                <Play size={20} color={colors.text} />
              ) : (
                <Pause size={20} color={colors.text} />
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleUploadAudio}
              style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
            >
              <Upload size={20} color={colors.text} />
            </Pressable>
          )}

          <Pressable
            onPress={recordingState.isRecording ? handleStopRecording : handleStartRecording}
          >
            <View style={styles.recordButtonContainer}>
              <Animated.View
                style={[
                  styles.recordButtonPulse,
                  { backgroundColor: colors.secondary },
                  animatedPulseStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.recordButton,
                  { backgroundColor: recordingState.isRecording ? colors.destructive : colors.secondary },
                  animatedRecordStyle,
                ]}
              >
                {recordingState.isRecording ? (
                  <Square size={24} color={colors.secondaryForeground} fill={colors.secondaryForeground} />
                ) : (
                  <Mic size={28} color={colors.secondaryForeground} />
                )}
              </Animated.View>
            </View>
          </Pressable>

          {recordingState.isRecording ? (
            <View style={styles.secondaryButton} />
          ) : (
            <View style={styles.secondaryButton} />
          )}
        </View>

        <ThemedText style={[styles.hint, { color: colors.mutedForeground }]}>
          {recordingState.isRecording
            ? recordingState.isPaused
              ? 'Paused'
              : 'Recording...'
            : 'Record or upload audio'}
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
  contextContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  contextLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  contextInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  recordingsContainer: {
    flex: 1,
  },
  recordingsContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  recordingCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordingInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordingDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  transcriptBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 22,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  transcribingText: {
    fontSize: 14,
  },
  transcribeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  transcribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  secondaryButton: {
    width: 80,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
