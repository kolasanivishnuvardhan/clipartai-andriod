# ClipartAI

Production-grade Expo SDK 51 Android app with Expo Router, Zustand, React Query, and Railway backend.

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

Create `.env` from `.env.example` and set your backend URL:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-railway-service.up.railway.app
```

3. Run app

```bash
npm run start
```

## Android APK Build (EAS)

Preview APK profile is configured in `eas.json`.

```bash
npm run build:apk
```

Equivalent command:

```bash
eas build -p android --profile preview
```
