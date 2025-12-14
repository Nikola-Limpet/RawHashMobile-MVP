import { Platform } from 'react-native';
import { Config } from '@/constants/config';

const { apiBase: GEMINI_API_BASE, model: MODEL_ID } = Config.gemini;

async function readFileAsBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // Web: use fetch to get the blob and convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/wav;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Native: use expo-file-system legacy API
    const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return base64;
  }
}

interface TranscriptionResult {
  text: string;
  confidence?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Transcribe audio file using Gemini Flash 2.5
   */
  async transcribeAudio(
    audioUri: string,
    mimeType: string = 'audio/wav'
  ): Promise<TranscriptionResult> {
    try {
      // Read audio file as base64
      const audioBase64 = await readFileAsBase64(audioUri);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this audio accurately. Return only the transcribed text without any additional commentary or formatting.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      };

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${MODEL_ID}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const transcribedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text: transcribedText.trim(),
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio with custom prompt for fine-tuning context
   */
  async transcribeWithContext(
    audioUri: string,
    context: string,
    mimeType: string = 'audio/wav'
  ): Promise<TranscriptionResult> {
    try {
      const audioBase64 = await readFileAsBase64(audioUri);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: `${context}\n\nTranscribe this audio accurately based on the context provided. Return only the transcribed text.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      };

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${MODEL_ID}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const transcribedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text: transcribedText.trim(),
      };
    } catch (error) {
      console.error('Transcription with context error:', error);
      throw error;
    }
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${MODEL_ID}?key=${this.apiKey}`,
        {
          method: 'GET',
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Demo transcription results for demo mode
const DEMO_TRANSCRIPTIONS = [
  "Hello, this is a demo transcription. The actual transcription would appear here when you connect your Gemini API key.",
  "Welcome to RawHash voice transcription. This demo shows how your transcribed text would appear.",
  "In demo mode, you can explore all the features without needing an API key. Connect your Gemini API key to get real transcriptions.",
];

export function getDemoTranscription(): TranscriptionResult {
  const randomIndex = Math.floor(Math.random() * DEMO_TRANSCRIPTIONS.length);
  return {
    text: DEMO_TRANSCRIPTIONS[randomIndex],
  };
}

// Helper to get MIME type from file extension
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'webm': 'audio/webm',
    'mp4': 'audio/mp4',
    '3gp': 'audio/3gpp',
  };
  return mimeTypes[ext || ''] || 'audio/wav';
}
