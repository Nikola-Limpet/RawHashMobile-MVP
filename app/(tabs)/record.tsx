import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
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
  FadeInDown,
} from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Trash2, Play, Pause, Mic, Square, X, FileAudio } from 'lucide-react-native';

import { GlassHeader, useTabBarHeight } from '@/components/ui/glass-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonRecording } from '@/components/ui/skeleton';
import { ProcessingModeSelector, ProcessingResultView } from '@/components/ui/processing-mode-selector';
import { useAudioRecording, formatDuration, normalizeMetering } from '@/services/audio-service';
import {
  GeminiService,
  getDemoProcessedResult,
  getMimeType,
  ProcessingMode,
} from '@/services/gemini-service';
import { useApiKeyStore } from '@/stores/api-key-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  uri: string;
  duration: number;
  transcript: string | null;
  isTranscribing: boolean;
  timestamp: Date;
  name?: string;
  mimeType?: string;
  processedResult?: {
    original: string;
    processed: string;
    summary?: string;
    keyPoints?: string[];
  };
  processingMode?: ProcessingMode;
}

export default function RecordTranscribeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { isDemoMode, apiKey } = useApiKeyStore();

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
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>('raw');

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

  const handleTranscribe = useCallback(async (recordingId: string, mode: ProcessingMode = selectedMode) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    setRecordings((prev) =>
      prev.map((r) =>
        r.id === recordingId ? { ...r, isTranscribing: true, processingMode: mode } : r
      )
    );

    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const result = getDemoProcessedResult(mode);
        setRecordings((prev) =>
          prev.map((r) =>
            r.id === recordingId
              ? {
                  ...r,
                  transcript: result.processed,
                  processedResult: result,
                  processingMode: mode,
                  isTranscribing: false,
                }
              : r
          )
        );
      } else if (apiKey) {
        const geminiService = new GeminiService(apiKey);
        const mimeType = recording.mimeType || 'audio/wav';

        const result = await geminiService.transcribeAndProcess(
          recording.uri,
          {
            mode,
            context: context.trim() || undefined,
          },
          mimeType
        );

        setRecordings((prev) =>
          prev.map((r) =>
            r.id === recordingId
              ? {
                  ...r,
                  transcript: result.processed,
                  processedResult: result,
                  processingMode: mode,
                  isTranscribing: false,
                }
              : r
          )
        );
      } else {
        throw new Error('No API key configured');
      }
    } catch (err) {
      setRecordings((prev) =>
        prev.map((r) =>
          r.id === recordingId ? { ...r, isTranscribing: false } : r
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to transcribe');
    }
  }, [recordings, isDemoMode, apiKey, context, selectedMode]);

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
        duration: 0,
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

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const metering = normalizeMetering(recordingState.metering);
  const headerHeight = insets.top + 60;

  return (
    <View className="flex-1 bg-background">
      <GlassHeader
        title="Record"
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
          paddingBottom: tabBarHeight + 140,
          gap: 16,
          ...(recordings.length === 0 && !recordingState.isRecording ? { flex: 1 } : {}),
        }}
      >
        {/* Processing Mode Selector */}
        <ProcessingModeSelector
          selected={selectedMode}
          onSelect={setSelectedMode}
        />

        {/* Context Input */}
        <View className="mb-4">
          <Text className="text-xs text-muted-foreground mb-1">
            Fine-tune Context (optional)
          </Text>
          <TextInput
            className={cn(
              'rounded-md border p-2 text-sm min-h-[60px] bg-muted',
              error ? 'border-destructive' : 'border-border'
            )}
            style={{ color: colors.foreground, textAlignVertical: 'top' }}
            placeholder="e.g., Medical terminology, Technical jargon, Specific names..."
            placeholderTextColor={colors.mutedForeground}
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={2}
          />
        </View>

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

        {recordings.length === 0 && !recordingState.isRecording && !error && (
          <EmptyState
            icon="audio"
            title="No recordings yet"
            description="Record audio or upload files to transcribe with fine-tuned context"
            actionLabel="Upload Audio"
            onAction={handleUploadAudio}
          />
        )}

        {recordings.map((recording, index) => (
          <Animated.View
            key={recording.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
            exiting={FadeOut.duration(200)}
            className="p-4 rounded-lg border border-border bg-card gap-4"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center">
                  {recording.name && (
                    <FileAudio size={16} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  )}
                  <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
                    {recording.name || `Recording ${recording.timestamp.toLocaleTimeString()}`}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {recording.name
                    ? recording.timestamp.toLocaleTimeString()
                    : `Duration: ${formatDuration(recording.duration)}`}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteRecording(recording.id)}
                className="p-2 rounded-sm bg-destructive/15"
              >
                <Trash2 size={16} color={colors.destructive} />
              </Pressable>
            </View>

            {recording.processedResult ? (
              <View className="gap-4">
                <ProcessingResultView
                  mode={recording.processingMode || 'raw'}
                  processed={recording.processedResult.processed}
                  summary={recording.processedResult.summary}
                  keyPoints={recording.processedResult.keyPoints}
                  original={recording.processedResult.original}
                  showOriginal={recording.processingMode !== 'raw' && recording.processedResult.original !== recording.processedResult.processed}
                />
                <View className="mt-1">
                  <ProcessingModeSelector
                    selected={recording.processingMode || 'raw'}
                    onSelect={(mode) => handleTranscribe(recording.id, mode)}
                    compact
                  />
                </View>
              </View>
            ) : recording.transcript ? (
              <View className="gap-4">
                <View className="p-2 rounded-md bg-muted">
                  <Text className="text-sm leading-[22px] text-foreground">
                    {recording.transcript}
                  </Text>
                </View>
                <View className="mt-1">
                  <ProcessingModeSelector
                    selected={selectedMode}
                    onSelect={(mode) => handleTranscribe(recording.id, mode)}
                    compact
                  />
                </View>
              </View>
            ) : recording.isTranscribing ? (
              <View className="-mt-2 gap-2">
                <SkeletonRecording count={1} />
                <Text className="text-xs text-muted-foreground text-center capitalize">
                  {recording.processingMode && recording.processingMode !== 'raw'
                    ? `Processing: ${recording.processingMode}`
                    : 'Transcribing...'}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                <Button
                  onPress={() => handleTranscribe(recording.id)}
                  variant="default"
                  size="md"
                  className="flex-1"
                >
                  Transcribe
                </Button>
              </View>
            )}
          </Animated.View>
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
                className="h-full rounded-sm bg-secondary"
                style={{ width: `${metering * 100}%` }}
              />
            </View>
            <Text className="text-sm text-muted-foreground tabular-nums">
              {formatDuration(recordingState.duration)}
            </Text>
          </Animated.View>
        )}

        <View className="flex-row items-center gap-6">
          {recordingState.isRecording ? (
            <Button
              variant="secondary"
              size="icon"
              onPress={recordingState.isPaused ? resumeRecording : pauseRecording}
              style={{ width: 48, height: 48 }}
            >
              {recordingState.isPaused ? (
                <Play size={20} color={colors.secondaryForeground} />
              ) : (
                <Pause size={20} color={colors.secondaryForeground} />
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onPress={handleUploadAudio}
              style={{ width: 48, height: 48 }}
            >
              <Upload size={20} color={colors.foreground} />
            </Button>
          )}

          <Pressable
            onPress={recordingState.isRecording ? handleStopRecording : handleStartRecording}
          >
            <View className="items-center justify-center">
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    backgroundColor: colors.secondary,
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
                    backgroundColor: recordingState.isRecording ? colors.destructive : colors.secondary,
                  },
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

          <View style={{ width: 48, height: 48 }} />
        </View>

        <Text className="text-sm text-muted-foreground">
          {recordingState.isRecording
            ? recordingState.isPaused
              ? 'Paused'
              : 'Recording...'
            : 'Record or upload audio'}
        </Text>
      </View>
    </View>
  );
}
