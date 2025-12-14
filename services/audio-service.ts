import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { useCallback, useState, useRef, useEffect } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri: string | null;
  metering: number;
  isPrepared: boolean;
}

export function useAudioRecording() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
    metering: -160,
    isPrepared: false,
  });
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const requestPermissions = useCallback(async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    return status.granted;
  }, []);

  const prepareRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      await audioRecorder.prepareToRecordAsync();
      setRecordingState((prev) => ({
        ...prev,
        isPrepared: true,
      }));
    } catch (error) {
      console.error('Failed to prepare recording:', error);
      throw error;
    }
  }, [audioRecorder, requestPermissions]);

  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Always prepare before recording
      if (!recordingState.isPrepared) {
        await audioRecorder.prepareToRecordAsync();
      }

      audioRecorder.record();
      startTime.current = Date.now();

      // Start duration tracking
      durationInterval.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime.current) / 1000),
          metering: prev.isRecording ? -30 + Math.random() * 30 : -160,
        }));
      }, 100);

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        isPrepared: true,
        duration: 0,
        uri: null,
      }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [audioRecorder, requestPermissions, recordingState.isPrepared]);

  const stopRecording = useCallback(async () => {
    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        isPrepared: false,
        uri: uri ?? null,
      }));

      return uri ?? null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }, [audioRecorder]);

  const pauseRecording = useCallback(async () => {
    try {
      audioRecorder.pause();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      setRecordingState((prev) => ({
        ...prev,
        isPaused: true,
      }));
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }, [audioRecorder]);

  const resumeRecording = useCallback(async () => {
    try {
      audioRecorder.record();
      const pausedDuration = recordingState.duration;
      startTime.current = Date.now() - pausedDuration * 1000;

      durationInterval.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime.current) / 1000),
          metering: prev.isRecording ? -30 + Math.random() * 30 : -160,
        }));
      }, 100);

      setRecordingState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }, [audioRecorder, recordingState.duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    prepareRecording,
    requestPermissions,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function normalizeMetering(metering: number): number {
  // Convert dB to 0-1 range (typically -160 to 0 dB)
  const normalized = (metering + 160) / 160;
  return Math.max(0, Math.min(1, normalized));
}
