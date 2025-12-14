# RawHash

A React Native voice transcription app built with Expo SDK 54. Record audio, upload files, and get AI-powered transcriptions using Google's Gemini Flash 2.5 API.

## Features

- **Live Transcription**: Quick voice-to-text with one tap
- **Record & Process**: Record audio with fine-tuned context for better accuracy
- **Multiple Processing Modes**:
  - Raw transcription
  - Clean/formatted text
  - Summary generation
  - Key points extraction
  - Professional formatting
  - Concise output
- **File Upload**: Import and transcribe existing audio files
- **Demo Mode**: Try the app without an API key
- **User Authentication**: Sign up/sign in with Better Auth
- **Secure Storage**: API keys stored securely with expo-secure-store

## Tech Stack

- **Framework**: [Expo](https://expo.dev) SDK 54 with React Native
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) v4
- **Styling**: [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) with Expo integration
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) (Docker)
- **AI**: Google Gemini Flash 2.5 API
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [Lucide React Native](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Docker & Docker Compose
- Expo CLI
- iOS Simulator / Android Emulator / Physical Device

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yuujin/rawhash.git
cd rawhash
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

4. Start the PostgreSQL database:
```bash
docker compose up -d
```

5. Run database migrations:
```bash
bun drizzle-kit push
```

6. Start the development server:
```bash
bun start
```

### Running on Device

- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Physical Device**: Scan QR code with Expo Go app

## Project Structure

```
rawhash/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Live transcription
│   │   ├── record.tsx     # Record & process
│   │   └── settings.tsx   # Settings & API key
│   └── api/               # Expo API Routes
│       └── auth/          # Better Auth endpoints
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                   # Core libraries
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth client
│   ├── db.ts             # Database connection
│   └── schema.ts         # Drizzle schema
├── stores/               # Zustand stores
│   ├── auth-store.ts     # User authentication state
│   └── api-key-store.ts  # Gemini API key state
├── services/             # API services
│   ├── audio-service.ts  # Audio recording
│   └── gemini-service.ts # Gemini API integration
├── constants/            # App constants & theme
└── hooks/               # Custom React hooks
```

## Configuration

### Gemini API Key

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

You can either:
1. Set it in `.env` as `EXPO_PUBLIC_GEMINI_API_KEY`
2. Enter it in the Settings screen within the app

### App Scheme

The app uses `rawhash://` as its deep link scheme. This is configured in `app.json`.

## Development

### TypeScript

Check types:
```bash
npx tsc --noEmit
```

### Database

The app uses PostgreSQL running in Docker (port 5433 to avoid conflicts with existing PostgreSQL instances).

Start database:
```bash
docker compose up -d
```

Stop database:
```bash
docker compose down
```

View database logs:
```bash
docker compose logs -f postgres
```

Generate migrations:
```bash
bun drizzle-kit generate
```

Push changes:
```bash
bun drizzle-kit push
```

### Clear Cache

```bash
bun start --clear
```

## API Reference

### Processing Modes

| Mode | Description |
|------|-------------|
| `raw` | Direct transcription without modification |
| `clean` | Remove filler words, fix grammar |
| `summary` | Generate a brief summary |
| `keypoints` | Extract key points as bullet list |
| `professional` | Format for professional use |
| `concise` | Compress while keeping meaning |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Yuujin**

---

Built with Expo and React Native
