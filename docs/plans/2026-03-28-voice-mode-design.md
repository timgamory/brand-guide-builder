# Voice Mode Design

**Date:** 2026-03-28
**Status:** Approved

Voice Mode adds an optional dedicated voice conversation experience to the brand guide wizard. Users click a button to enter a full-screen overlay where AI questions are spoken aloud and user answers are captured via speech-to-text, then transcribed into the existing conversation store.

## User Experience

A "Voice" button in the chat panel header opens a full-screen overlay. The overlay replaces the chat UI with a focused voice experience featuring:

- AI question displayed as text AND spoken aloud via cloud TTS
- A mic button the user taps to speak their answer
- Live transcription appearing on screen as the user talks
- Clear turn-taking: AI speaks, user speaks, repeat

Two exit paths:
- **"End Session"**: Triggers the AI to generate a section review from what's been gathered
- **"Skip to Text"**: Returns to the text chat with the conversation intact

Voice mode works for both Entrepreneur and Intern paths. For interns, it applies to the synthesis phase (after research tasks), not the research task phase.

## Architecture

Voice mode is a UI layer on top of the existing conversation engine. No changes to the AI service, conversation store, or review flow.

```
┌─────────────────────────────────────────────────┐
│                  VoiceOverlay                    │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐  │
│  │ TTS      │    │ STT      │    │ Voice     │  │
│  │ Service  │    │ Service  │    │ State     │  │
│  │(ElevenLabs)   │(Browser/ │    │ Machine   │  │
│  │          │    │ Cloud)   │    │           │  │
│  └────┬─────┘    └────┬─────┘    └─────┬─────┘  │
│       │               │               │         │
└───────┼───────────────┼───────────────┼─────────┘
        │               │               │
        ▼               ▼               ▼
┌─────────────────────────────────────────────────┐
│          Existing Infrastructure                 │
│                                                  │
│  conversationStore.addMessage()                  │
│  sendMessage() via ai.ts                         │
│  SectionReview component                         │
└─────────────────────────────────────────────────┘
```

Key decisions:
- **VoiceOverlay** is a self-contained component rendered by WizardSection when voice mode is active. It uses the same `onSend` callback as ChatInput.
- **No new stores.** Voice mode reads/writes the same `conversationStore` and `brandGuideStore` that text chat uses.
- Voice Q&A becomes regular `user`/`assistant` messages in the conversation store, feeding into the existing review flow.

## Voice State Machine

```
idle → ai_speaking → waiting_for_user → user_speaking → processing → ai_speaking (loop)
                                                                   → done (if review JSON)
```

**States:**
- `idle`: Overlay just opened
- `ai_speaking`: TTS playing the AI question
- `waiting_for_user`: Mic button enabled, waiting for tap
- `user_speaking`: STT active, live transcript visible
- `processing`: User's message sent to AI, waiting for response
- `done`: Review JSON detected, overlay closes, SectionReview shows

**Transitions:**
- `idle → ai_speaking`: On mount, send section opener (or resume from last AI message), pipe through TTS
- `ai_speaking → waiting_for_user`: TTS `onEnd` callback
- `waiting_for_user → user_speaking`: User taps mic
- `user_speaking → processing`: User taps stop or 3s silence detection
- `processing → ai_speaking`: AI responds with normal message
- `processing → done`: AI responds with review JSON (detected by existing `parseSectionReview()`)

**Edge cases:**
- "Skip to Text": Any state closes overlay, conversation intact
- "End Session": Sends "wrap up and generate review" message, transitions to `done`
- TTS interrupted: User taps mic while AI speaking, TTS stops, transitions to `user_speaking`
- STT error: Inline text input appears within overlay so user isn't stuck
- Silence false positive: 3s threshold, then "Send" / "Keep talking" confirmation

## TTS Service (ElevenLabs)

```typescript
interface TTSService {
  speak(text: string): Promise<void>  // resolves when audio finishes
  stop(): void                         // interrupt playback
  isPlaying(): boolean
}
```

- Calls ElevenLabs API via a new Vercel Edge Function (`api/tts.ts`) to keep API key server-side
- Returns audio stream; client plays via `HTMLAudioElement`
- Voice ID configured as env var (`ELEVENLABS_VOICE_ID`)
- Rate limiting: 20 req/min per IP (matching chat proxy)

## STT Service (Dual Provider)

```typescript
interface STTService {
  start(): void
  stop(): Promise<string>              // final transcript
  onInterim(cb: (text: string) => void): void  // live partial results
  isListening(): boolean
}
```

**Browser provider** (default): Wraps `webkitSpeechRecognition` / `SpeechRecognition`. Free, real-time interim results. Works well in Chrome.

**Cloud provider** (admin toggle): Records via `MediaRecorder` + `getUserMedia()`, sends blob to Edge Function (`api/stt.ts`) calling Whisper or Deepgram. More latency but consistent accuracy.

**Auto-fallback**: If browser STT unavailable (Firefox, Safari), automatically use cloud provider regardless of toggle setting.

## Entry Point

Mic button in chat panel header:

```
┌─────────────────────────────────────────┐
│  Brand Basics          [🎧 Voice]  [⋯] │
├─────────────────────────────────────────┤
```

- First click prompts for microphone permission
- Permission denied: toast explaining mic is required, button non-functional
- Permission granted: opens VoiceOverlay
- Hidden when section is in `review` status

## Admin Settings

Stored in localStorage (could move to Supabase settings table later):

| Setting | Values | Default |
|---------|--------|---------|
| `voiceEnabled` | `true` / `false` | `true` |
| `voiceSttProvider` | `'browser'` / `'cloud'` | `'browser'` |
| `voiceFollowUps` | `true` / `false` | `false` |

- `voiceEnabled = false` hides the Voice button entirely
- `voiceFollowUps = true` allows AI to ask unscripted follow-up questions in voice mode

## Browser Compatibility

| Browser | TTS (Cloud) | STT (Browser) | STT (Cloud) | Overall |
|---------|-------------|----------------|-------------|---------|
| Chrome | Yes | Yes | Yes | Full support |
| Safari | Yes | Partial | Yes | Cloud fallback |
| Firefox | Yes | No | Yes | Auto cloud fallback |
| Mobile Chrome | Yes | Yes | Yes | Full support |
| Mobile Safari | Yes | Partial | Yes | Cloud fallback |

## Error Handling

- **Mic permission denied**: Toast, fall back to text chat. Voice button shows tooltip.
- **TTS API fails**: Show question as text only, skip audio, continue flow.
- **STT fails mid-recording**: Inline text input within overlay.
- **Network loss**: Same retry logic as `sendMessage()` in `ai.ts`. After retries fail, option to retry or switch to text.
- **Silence false positive**: 3s threshold, then "Send" / "Keep talking" confirmation.

## New Environment Variables

- `ELEVENLABS_API_KEY` — server-side, for TTS proxy
- `ELEVENLABS_VOICE_ID` — voice selection
- `STT_PROVIDER_API_KEY` — server-side, for cloud STT proxy (optional, only if cloud STT enabled)

## What Doesn't Change

- Conversation store
- AI service (`ai.ts`)
- System prompts
- Section definitions
- Review components
- Document generation
- Supabase schema

## New Files

- `src/components/voice/VoiceOverlay.tsx` — full-screen overlay component
- `src/components/voice/VoiceWaveform.tsx` — visual audio indicator
- `src/services/tts.ts` — TTS service wrapper
- `src/services/stt.ts` — STT service wrapper (browser + cloud implementations)
- `src/hooks/useVoiceStateMachine.ts` — state machine hook
- `src/hooks/useVoiceSettings.ts` — admin toggle reader
- `api/tts.ts` — Vercel Edge Function for ElevenLabs proxy
- `api/stt.ts` — Vercel Edge Function for cloud STT proxy
