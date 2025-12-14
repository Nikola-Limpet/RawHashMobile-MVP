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

interface ProcessedResult {
  original: string;
  processed: string;
  summary?: string;
  keyPoints?: string[];
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

export type ProcessingMode = 'raw' | 'clean' | 'summary' | 'keypoints' | 'professional' | 'concise';

export interface ProcessingOptions {
  mode: ProcessingMode;
  context?: string;
  language?: string;
  preserveTone?: boolean;
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(requestBody: object): Promise<string> {
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

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  /**
   * Transcribe audio file using Gemini Flash 2.5
   */
  async transcribeAudio(
    audioUri: string,
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

      const text = await this.makeRequest(requestBody);
      return { text };
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

      const text = await this.makeRequest(requestBody);
      return { text };
    } catch (error) {
      console.error('Transcription with context error:', error);
      throw error;
    }
  }

  /**
   * Transcribe and process audio in one step
   */
  async transcribeAndProcess(
    audioUri: string,
    options: ProcessingOptions,
    mimeType: string = 'audio/wav'
  ): Promise<ProcessedResult> {
    try {
      const audioBase64 = await readFileAsBase64(audioUri);
      const prompt = this.buildProcessingPrompt(options);

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
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      };

      const result = await this.makeRequest(requestBody);
      return this.parseProcessedResult(result, options.mode);
    } catch (error) {
      console.error('Transcribe and process error:', error);
      throw error;
    }
  }

  /**
   * Process existing text with AI enhancement
   */
  async processText(
    text: string,
    options: ProcessingOptions
  ): Promise<ProcessedResult> {
    try {
      const prompt = this.buildTextProcessingPrompt(text, options);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      };

      const result = await this.makeRequest(requestBody);
      return this.parseProcessedResult(result, options.mode, text);
    } catch (error) {
      console.error('Process text error:', error);
      throw error;
    }
  }

  /**
   * Get a summary of the transcribed text
   */
  async summarize(text: string, maxSentences: number = 3): Promise<string> {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Summarize the following text in ${maxSentences} sentences or less. Focus on the main points and key information. Be concise and clear.\n\nText:\n${text}\n\nSummary:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      };

      return await this.makeRequest(requestBody);
    } catch (error) {
      console.error('Summarize error:', error);
      throw error;
    }
  }

  /**
   * Extract key points from text
   */
  async extractKeyPoints(text: string, maxPoints: number = 5): Promise<string[]> {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Extract up to ${maxPoints} key points from the following text. Return each point on a new line, starting with "• ". Focus on the most important information.\n\nText:\n${text}\n\nKey Points:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      };

      const result = await this.makeRequest(requestBody);
      return result
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);
    } catch (error) {
      console.error('Extract key points error:', error);
      throw error;
    }
  }

  /**
   * Clean and improve text quality
   */
  async cleanText(text: string, options?: { preserveTone?: boolean; context?: string }): Promise<string> {
    try {
      let prompt = `Clean and improve the following transcribed text:
- Fix grammar and punctuation errors
- Remove filler words (um, uh, like, you know, etc.)
- Improve sentence structure while keeping the meaning
- Remove repetitions and false starts
${options?.preserveTone ? '- Preserve the original tone and style' : '- Make it more professional and clear'}
${options?.context ? `- Context: ${options.context}` : ''}

Original text:
${text}

Cleaned text:`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      };

      return await this.makeRequest(requestBody);
    } catch (error) {
      console.error('Clean text error:', error);
      throw error;
    }
  }

  /**
   * Make text more concise by removing unnecessary parts
   */
  async makeConcise(text: string): Promise<string> {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Make the following text more concise by removing unnecessary words, redundancies, and tangential information while preserving the core meaning and key details. Return only the concise version.\n\nOriginal:\n${text}\n\nConcise version:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      };

      return await this.makeRequest(requestBody);
    } catch (error) {
      console.error('Make concise error:', error);
      throw error;
    }
  }

  /**
   * Convert to professional/formal tone
   */
  async toProfessional(text: string): Promise<string> {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Convert the following text to a professional, formal tone suitable for business communication. Fix any errors, improve clarity, and maintain the original meaning.\n\nOriginal:\n${text}\n\nProfessional version:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      };

      return await this.makeRequest(requestBody);
    } catch (error) {
      console.error('To professional error:', error);
      throw error;
    }
  }

  private buildProcessingPrompt(options: ProcessingOptions): string {
    const { mode, context, language } = options;
    let basePrompt = '';

    switch (mode) {
      case 'clean':
        basePrompt = `Transcribe this audio and clean up the text:
- Fix grammar and punctuation
- Remove filler words (um, uh, like, you know)
- Improve sentence structure
- Remove repetitions and false starts
Return only the cleaned transcription.`;
        break;

      case 'summary':
        basePrompt = `Transcribe this audio and provide a concise summary (2-3 sentences) of the main points. Format as:
TRANSCRIPTION:
[full transcription]

SUMMARY:
[2-3 sentence summary]`;
        break;

      case 'keypoints':
        basePrompt = `Transcribe this audio and extract the key points. Format as:
TRANSCRIPTION:
[full transcription]

KEY POINTS:
• [point 1]
• [point 2]
• [point 3]`;
        break;

      case 'professional':
        basePrompt = `Transcribe this audio and convert it to professional, formal language suitable for business communication. Fix any errors and improve clarity.
Return only the professional version.`;
        break;

      case 'concise':
        basePrompt = `Transcribe this audio and make it concise by removing unnecessary words, redundancies, and tangential information while preserving the core meaning.
Return only the concise version.`;
        break;

      default:
        basePrompt = 'Transcribe this audio accurately. Return only the transcribed text.';
    }

    if (context) {
      basePrompt = `Context: ${context}\n\n${basePrompt}`;
    }

    if (language) {
      basePrompt += `\n\nTranscribe in ${language}.`;
    }

    return basePrompt;
  }

  private buildTextProcessingPrompt(text: string, options: ProcessingOptions): string {
    const { mode, context, preserveTone } = options;

    switch (mode) {
      case 'clean':
        return `Clean and improve this text:
- Fix grammar and punctuation
- Remove filler words
- Improve sentence structure
${preserveTone ? '- Preserve the original tone' : ''}
${context ? `Context: ${context}` : ''}

Text: ${text}

Cleaned text:`;

      case 'summary':
        return `Provide a concise summary (2-3 sentences) of the main points from this text:

${text}

Summary:`;

      case 'keypoints':
        return `Extract the key points from this text (use bullet points):

${text}

Key Points:`;

      case 'professional':
        return `Convert this text to professional, formal language:

${text}

Professional version:`;

      case 'concise':
        return `Make this text more concise while preserving the core meaning:

${text}

Concise version:`;

      default:
        return text;
    }
  }

  private parseProcessedResult(result: string, mode: ProcessingMode, original?: string): ProcessedResult {
    const output: ProcessedResult = {
      original: original || '',
      processed: result,
    };

    if (mode === 'summary' && result.includes('TRANSCRIPTION:')) {
      const parts = result.split('SUMMARY:');
      const transcription = parts[0].replace('TRANSCRIPTION:', '').trim();
      const summary = parts[1]?.trim() || '';
      output.original = transcription;
      output.processed = transcription;
      output.summary = summary;
    } else if (mode === 'keypoints' && result.includes('TRANSCRIPTION:')) {
      const parts = result.split('KEY POINTS:');
      const transcription = parts[0].replace('TRANSCRIPTION:', '').trim();
      const keyPointsText = parts[1]?.trim() || '';
      output.original = transcription;
      output.processed = transcription;
      output.keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);
    }

    return output;
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

const DEMO_SUMMARIES = [
  "This is a demo showing the transcription feature. Connect your API key for real results.",
  "RawHash demonstrates voice-to-text capabilities with AI processing.",
  "Demo mode allows exploring features without API configuration.",
];

const DEMO_KEY_POINTS = [
  ["Demo transcription feature", "API key required for full functionality", "Explore all features in demo mode"],
  ["Voice to text conversion", "AI-powered processing", "Multiple enhancement options"],
  ["Clean transcriptions", "Summary generation", "Key points extraction"],
];

export function getDemoTranscription(): TranscriptionResult {
  const randomIndex = Math.floor(Math.random() * DEMO_TRANSCRIPTIONS.length);
  return {
    text: DEMO_TRANSCRIPTIONS[randomIndex],
  };
}

export function getDemoProcessedResult(mode: ProcessingMode): ProcessedResult {
  const randomIndex = Math.floor(Math.random() * DEMO_TRANSCRIPTIONS.length);
  const original = DEMO_TRANSCRIPTIONS[randomIndex];

  switch (mode) {
    case 'summary':
      return {
        original,
        processed: original,
        summary: DEMO_SUMMARIES[randomIndex],
      };
    case 'keypoints':
      return {
        original,
        processed: original,
        keyPoints: DEMO_KEY_POINTS[randomIndex],
      };
    case 'clean':
    case 'professional':
    case 'concise':
      return {
        original,
        processed: original.replace(/um,?\s*/gi, '').replace(/uh,?\s*/gi, ''),
      };
    default:
      return {
        original,
        processed: original,
      };
  }
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

// Processing mode labels for UI
export const PROCESSING_MODE_LABELS: Record<ProcessingMode, { label: string; description: string; icon: string }> = {
  raw: {
    label: 'Raw',
    description: 'Original transcription without processing',
    icon: 'file-text',
  },
  clean: {
    label: 'Clean',
    description: 'Remove filler words and fix grammar',
    icon: 'sparkles',
  },
  summary: {
    label: 'Summary',
    description: 'Get a brief summary of the content',
    icon: 'file-minus',
  },
  keypoints: {
    label: 'Key Points',
    description: 'Extract main points as bullet list',
    icon: 'list',
  },
  professional: {
    label: 'Professional',
    description: 'Convert to formal business tone',
    icon: 'briefcase',
  },
  concise: {
    label: 'Concise',
    description: 'Remove unnecessary information',
    icon: 'scissors',
  },
};
