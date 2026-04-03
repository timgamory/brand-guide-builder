# Voice Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated voice conversation mode where AI questions are spoken aloud and user answers are captured via speech-to-text, feeding into the existing conversation engine.

**Architecture:** VoiceOverlay is a self-contained full-screen component layered on top of WizardSection. It uses TTS (ElevenLabs via Edge Function proxy) and STT (browser SpeechRecognition with cloud fallback) to handle voice I/O, writing messages to the existing conversationStore. A state machine hook manages turn-taking. No changes to existing stores, AI service, or review flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Zustand, Vercel Edge Functions, ElevenLabs TTS API, Web Speech API (SpeechRecognition), MediaRecorder API

**Design doc:** `docs/plans/2026-03-28-voice-mode-design.md`

---

## Task 1: Voice Settings Hook

**Files:**
- Create: `src/hooks/useVoiceSettings.ts`
- Create: `src/hooks/__tests__/useVoiceSettings.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useVoiceSettings.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useVoiceSettings } from '../useVoiceSettings'

describe('useVoiceSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default settings when nothing in localStorage', () => {
    const { result } = renderHook(() => useVoiceSettings())
    expect(result.current.voiceEnabled).toBe(true)
    expect(result.current.sttProvider).toBe('browser')
    expect(result.current.followUpsEnabled).toBe(false)
  })

  it('reads settings from localStorage', () => {
    localStorage.setItem('voiceEnabled', 'false')
    localStorage.setItem('voiceSttProvider', 'cloud')
    localStorage.setItem('voiceFollowUps', 'true')
    const { result } = renderHook(() => useVoiceSettings())
    expect(result.current.voiceEnabled).toBe(false)
    expect(result.current.sttProvider).toBe('cloud')
    expect(result.current.followUpsEnabled).toBe(true)
  })

  it('setSttProvider updates localStorage and state', () => {
    const { result } = renderHook(() => useVoiceSettings())
    act(() => result.current.setSttProvider('cloud'))
    expect(result.current.sttProvider).toBe('cloud')
    expect(localStorage.getItem('voiceSttProvider')).toBe('cloud')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useVoiceSettings.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useVoiceSettings.ts
import { useState, useCallback } from 'react'

type SttProvider = 'browser' | 'cloud'

export function useVoiceSettings() {
  const [voiceEnabled, setVoiceEnabledState] = useState(
    () => localStorage.getItem('voiceEnabled') !== 'false'
  )
  const [sttProvider, setSttProviderState] = useState<SttProvider>(
    () => (localStorage.getItem('voiceSttProvider') as SttProvider) || 'browser'
  )
  const [followUpsEnabled, setFollowUpsEnabledState] = useState(
    () => localStorage.getItem('voiceFollowUps') === 'true'
  )

  const setVoiceEnabled = useCallback((v: boolean) => {
    localStorage.setItem('voiceEnabled', String(v))
    setVoiceEnabledState(v)
  }, [])

  const setSttProvider = useCallback((p: SttProvider) => {
    localStorage.setItem('voiceSttProvider', p)
    setSttProviderState(p)
  }, [])

  const setFollowUpsEnabled = useCallback((v: boolean) => {
    localStorage.setItem('voiceFollowUps', String(v))
    setFollowUpsEnabledState(v)
  }, [])

  return {
    voiceEnabled, setVoiceEnabled,
    sttProvider, setSttProvider,
    followUpsEnabled, setFollowUpsEnabled,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useVoiceSettings.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useVoiceSettings.ts src/hooks/__tests__/useVoiceSettings.test.ts
git commit -m "feat(voice): add voice settings hook with localStorage persistence"
```

---

## Task 2: Voice State Machine Hook

**Files:**
- Create: `src/hooks/useVoiceStateMachine.ts`
- Create: `src/hooks/__tests__/useVoiceStateMachine.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useVoiceStateMachine.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useVoiceStateMachine } from '../useVoiceStateMachine'

describe('useVoiceStateMachine', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    expect(result.current.state).toBe('idle')
  })

  it('transitions idle → ai_speaking', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    expect(result.current.state).toBe('ai_speaking')
  })

  it('transitions ai_speaking → waiting_for_user', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('TTS_ENDED'))
    expect(result.current.state).toBe('waiting_for_user')
  })

  it('transitions waiting_for_user → user_speaking', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('TTS_ENDED'))
    act(() => result.current.transition('MIC_STARTED'))
    expect(result.current.state).toBe('user_speaking')
  })

  it('transitions user_speaking → processing', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('TTS_ENDED'))
    act(() => result.current.transition('MIC_STARTED'))
    act(() => result.current.transition('MIC_STOPPED'))
    expect(result.current.state).toBe('processing')
  })

  it('transitions processing → ai_speaking on normal response', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('TTS_ENDED'))
    act(() => result.current.transition('MIC_STARTED'))
    act(() => result.current.transition('MIC_STOPPED'))
    act(() => result.current.transition('AI_RESPONDED'))
    expect(result.current.state).toBe('ai_speaking')
  })

  it('transitions processing → done on review response', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('TTS_ENDED'))
    act(() => result.current.transition('MIC_STARTED'))
    act(() => result.current.transition('MIC_STOPPED'))
    act(() => result.current.transition('REVIEW_DETECTED'))
    expect(result.current.state).toBe('done')
  })

  it('allows interrupt: ai_speaking → user_speaking on MIC_STARTED', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.transition('MIC_STARTED'))
    expect(result.current.state).toBe('user_speaking')
  })

  it('ignores invalid transitions', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('MIC_STOPPED'))
    expect(result.current.state).toBe('idle')
  })

  it('resets to idle', () => {
    const { result } = renderHook(() => useVoiceStateMachine())
    act(() => result.current.transition('START_SPEAKING'))
    act(() => result.current.reset())
    expect(result.current.state).toBe('idle')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useVoiceStateMachine.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useVoiceStateMachine.ts
import { useCallback, useState } from 'react'

export type VoiceState =
  | 'idle'
  | 'ai_speaking'
  | 'waiting_for_user'
  | 'user_speaking'
  | 'processing'
  | 'done'

export type VoiceEvent =
  | 'START_SPEAKING'
  | 'TTS_ENDED'
  | 'MIC_STARTED'
  | 'MIC_STOPPED'
  | 'AI_RESPONDED'
  | 'REVIEW_DETECTED'

const transitions: Record<VoiceState, Partial<Record<VoiceEvent, VoiceState>>> = {
  idle: { START_SPEAKING: 'ai_speaking' },
  ai_speaking: { TTS_ENDED: 'waiting_for_user', MIC_STARTED: 'user_speaking' },
  waiting_for_user: { MIC_STARTED: 'user_speaking' },
  user_speaking: { MIC_STOPPED: 'processing' },
  processing: { AI_RESPONDED: 'ai_speaking', REVIEW_DETECTED: 'done' },
  done: {},
}

export function useVoiceStateMachine() {
  const [state, setState] = useState<VoiceState>('idle')

  const transition = useCallback((event: VoiceEvent) => {
    setState((current) => transitions[current][event] ?? current)
  }, [])

  const reset = useCallback(() => setState('idle'), [])

  return { state, transition, reset }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useVoiceStateMachine.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useVoiceStateMachine.ts src/hooks/__tests__/useVoiceStateMachine.test.ts
git commit -m "feat(voice): add voice state machine hook with turn-taking transitions"
```

---

## Task 3: TTS Edge Function Proxy

**Files:**
- Create: `api/tts.ts`
- Reference: `api/chat.ts` (replicate rate limiting, origin validation pattern)

**Step 1: Write the Edge Function**

```typescript
// api/tts.ts
export const config = { runtime: 'edge' }

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin') || ''
  const referer = request.headers.get('referer') || ''
  const allowed = ['localhost', 'elevate-brand.vercel.app']
  return allowed.some((h) => origin.includes(h) || referer.includes(h))
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const ip = getRateLimitKey(request)
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!apiKey || !voiceId) {
    return new Response(JSON.stringify({ error: 'TTS not configured' }), { status: 500 })
  }

  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string' || text.length > 5000) {
      return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400 })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return new Response(JSON.stringify({ error: 'TTS API error', details: errText }), {
        status: 502,
      })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
```

**Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add api/tts.ts
git commit -m "feat(voice): add TTS Edge Function proxy for ElevenLabs"
```

---

## Task 4: TTS Client Service

**Files:**
- Create: `src/services/tts.ts`
- Create: `src/services/__tests__/tts.test.ts`

**Step 1: Write the failing test**

```typescript
// src/services/__tests__/tts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TTSService } from '../tts'

// Mock HTMLAudioElement
const mockPlay = vi.fn(() => Promise.resolve())
const mockPause = vi.fn()
let mockAudio: { play: typeof mockPlay; pause: typeof mockPause; src: string; onended: (() => void) | null; onerror: ((e: unknown) => void) | null }

vi.stubGlobal('Audio', vi.fn(() => {
  mockAudio = { play: mockPlay, pause: mockPause, src: '', onended: null, onerror: null }
  return mockAudio
}))

// Mock URL.createObjectURL / revokeObjectURL
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})

describe('TTSService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('speak() calls /api/tts and plays audio', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    vi.mocked(fetch).mockResolvedValueOnce(new Response(mockBlob, { status: 200 }))

    const tts = new TTSService()
    const speakPromise = tts.speak('Hello world')

    // Simulate audio ending
    await vi.waitFor(() => expect(mockAudio.onended).toBeTruthy())
    mockAudio.onended!()

    await speakPromise
    expect(fetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({ method: 'POST' }))
    expect(mockPlay).toHaveBeenCalled()
  })

  it('stop() pauses audio and resolves pending speak()', () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    vi.mocked(fetch).mockResolvedValueOnce(new Response(mockBlob, { status: 200 }))

    const tts = new TTSService()
    tts.speak('Hello')

    tts.stop()
    expect(mockPause).toHaveBeenCalled()
  })

  it('isPlaying() returns false initially', () => {
    const tts = new TTSService()
    expect(tts.isPlaying()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/tts.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/services/tts.ts
export class TTSService {
  private audio: HTMLAudioElement | null = null
  private playing = false
  private resolveSpeak: (() => void) | null = null

  async speak(text: string): Promise<void> {
    this.stop()

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    return new Promise<void>((resolve, reject) => {
      this.resolveSpeak = resolve
      this.audio = new Audio()
      this.audio.src = url
      this.playing = true

      this.audio.onended = () => {
        this.playing = false
        URL.revokeObjectURL(url)
        resolve()
      }

      this.audio.onerror = (e) => {
        this.playing = false
        URL.revokeObjectURL(url)
        reject(e)
      }

      this.audio.play().catch(reject)
    })
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio = null
      this.playing = false
      this.resolveSpeak?.()
      this.resolveSpeak = null
    }
  }

  isPlaying(): boolean {
    return this.playing
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/__tests__/tts.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/tts.ts src/services/__tests__/tts.test.ts
git commit -m "feat(voice): add TTS client service wrapping ElevenLabs proxy"
```

---

## Task 5: Browser STT Service

**Files:**
- Create: `src/services/stt.ts`
- Create: `src/services/__tests__/stt.test.ts`

**Step 1: Write the failing test**

```typescript
// src/services/__tests__/stt.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserSTTService } from '../stt'

// Mock SpeechRecognition
const mockStart = vi.fn()
const mockStop = vi.fn()
const mockAbort = vi.fn()
let mockRecognition: {
  start: typeof mockStart
  stop: typeof mockStop
  abort: typeof mockAbort
  continuous: boolean
  interimResults: boolean
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
}

vi.stubGlobal('webkitSpeechRecognition', vi.fn(() => {
  mockRecognition = {
    start: mockStart,
    stop: mockStop,
    abort: mockAbort,
    continuous: false,
    interimResults: false,
    onresult: null,
    onerror: null,
    onend: null,
  }
  return mockRecognition
}))

describe('BrowserSTTService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isAvailable() returns true when SpeechRecognition exists', () => {
    expect(BrowserSTTService.isAvailable()).toBe(true)
  })

  it('start() begins recognition', () => {
    const stt = new BrowserSTTService()
    stt.start()
    expect(mockStart).toHaveBeenCalled()
    expect(stt.isListening()).toBe(true)
  })

  it('stop() resolves with final transcript', async () => {
    const stt = new BrowserSTTService()
    stt.start()

    // Simulate a result event
    const resultEvent = {
      results: [[{ transcript: 'hello world' }]],
      resultIndex: 0,
    }
    mockRecognition.onresult!(resultEvent)

    const stopPromise = stt.stop()
    // Simulate recognition ending
    mockRecognition.onend!()

    const transcript = await stopPromise
    expect(transcript).toBe('hello world')
  })

  it('onInterim() fires with partial results', () => {
    const stt = new BrowserSTTService()
    const cb = vi.fn()
    stt.onInterim(cb)
    stt.start()

    // Simulate interim result
    const resultEvent = {
      results: { 0: { 0: { transcript: 'hel' }, isFinal: false }, length: 1 },
      resultIndex: 0,
    }
    Object.defineProperty(resultEvent.results[0], 'isFinal', { value: false })
    mockRecognition.onresult!(resultEvent)

    expect(cb).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/stt.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/services/stt.ts

// --- Interface ---

export interface STTService {
  start(): void
  stop(): Promise<string>
  onInterim(cb: (text: string) => void): void
  isListening(): boolean
}

// --- Browser provider ---

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  const w = window as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionType)
    | null
}

export class BrowserSTTService implements STTService {
  private recognition: ReturnType<typeof this.createRecognition> | null = null
  private listening = false
  private interimCb: ((text: string) => void) | null = null
  private finalTranscript = ''
  private resolveStop: ((text: string) => void) | null = null

  static isAvailable(): boolean {
    return getSpeechRecognition() !== null
  }

  private createRecognition() {
    const Ctor = getSpeechRecognition()
    if (!Ctor) throw new Error('SpeechRecognition not available')
    const r = new Ctor() as Record<string, unknown>
    r.continuous = true
    r.interimResults = true
    return r
  }

  start(): void {
    this.finalTranscript = ''
    this.recognition = this.createRecognition()
    const r = this.recognition as Record<string, unknown>

    r.onresult = (event: Record<string, unknown>) => {
      const results = event.results as Record<string, Record<string, { transcript: string }> & { isFinal?: boolean }>
      let interim = ''
      let final = ''

      for (let i = 0; i < (results.length as unknown as number); i++) {
        const result = results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) this.finalTranscript = final
      if (this.interimCb) this.interimCb(this.finalTranscript + interim)
    }

    r.onend = () => {
      this.listening = false
      this.resolveStop?.(this.finalTranscript)
      this.resolveStop = null
    }

    r.onerror = () => {
      this.listening = false
      this.resolveStop?.(this.finalTranscript)
      this.resolveStop = null
    }

    ;(r as { start: () => void }).start()
    this.listening = true
  }

  stop(): Promise<string> {
    return new Promise((resolve) => {
      this.resolveStop = resolve
      if (this.recognition) {
        ;(this.recognition as { stop: () => void }).stop()
      } else {
        resolve(this.finalTranscript)
      }
    })
  }

  onInterim(cb: (text: string) => void): void {
    this.interimCb = cb
  }

  isListening(): boolean {
    return this.listening
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/__tests__/stt.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/stt.ts src/services/__tests__/stt.test.ts
git commit -m "feat(voice): add browser STT service wrapping Web Speech API"
```

---

## Task 6: Cloud STT Edge Function + Client

**Files:**
- Create: `api/stt.ts`
- Modify: `src/services/stt.ts` (add CloudSTTService class)

**Step 1: Write the Edge Function**

```typescript
// api/stt.ts
export const config = { runtime: 'edge' }

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin') || ''
  const referer = request.headers.get('referer') || ''
  const allowed = ['localhost', 'elevate-brand.vercel.app']
  return allowed.some((h) => origin.includes(h) || referer.includes(h))
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const ip = getRateLimitKey(request)
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })
  }

  const apiKey = process.env.STT_PROVIDER_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'STT not configured' }), { status: 500 })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file' }), { status: 400 })
    }

    // Max 25MB (Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Audio too large' }), { status: 400 })
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'en')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return new Response(JSON.stringify({ error: 'STT API error', details: errText }), {
        status: 502,
      })
    }

    const result = await response.json()
    return new Response(JSON.stringify({ text: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
```

**Step 2: Add CloudSTTService to `src/services/stt.ts`**

Append to the end of the file:

```typescript
// --- Cloud provider ---

export class CloudSTTService implements STTService {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private listening = false
  private interimCb: ((text: string) => void) | null = null

  start(): void {
    this.chunks = []
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data)
      }
      this.mediaRecorder.start(250) // 250ms chunks for responsiveness
      this.listening = true
      this.interimCb?.('(listening...)')
    })
  }

  async stop(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        resolve('')
        return
      }

      this.mediaRecorder.onstop = async () => {
        this.listening = false
        // Stop all tracks to release mic
        this.mediaRecorder?.stream.getTracks().forEach((t) => t.stop())

        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'audio.webm')

        try {
          const response = await fetch('/api/stt', { method: 'POST', body: formData })
          if (!response.ok) throw new Error('STT request failed')
          const result = await response.json()
          resolve(result.text || '')
        } catch {
          resolve('')
        }
      }

      this.mediaRecorder.stop()
    })
  }

  onInterim(cb: (text: string) => void): void {
    this.interimCb = cb
  }

  isListening(): boolean {
    return this.listening
  }
}

// --- Factory ---

export function createSTTService(provider: 'browser' | 'cloud'): STTService {
  if (provider === 'browser' && BrowserSTTService.isAvailable()) {
    return new BrowserSTTService()
  }
  return new CloudSTTService()
}
```

**Step 3: Verify types**

Run: `npx tsc -b`
Expected: PASS

**Step 4: Commit**

```bash
git add api/stt.ts src/services/stt.ts
git commit -m "feat(voice): add cloud STT Edge Function proxy and client with factory"
```

---

## Task 7: VoiceOverlay Component

**Files:**
- Create: `src/components/voice/VoiceOverlay.tsx`

This is the core UI component. It orchestrates the state machine, TTS, and STT services.

**Step 1: Write the component**

```typescript
// src/components/voice/VoiceOverlay.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceStateMachine } from '@/hooks/useVoiceStateMachine'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import { TTSService } from '@/services/tts'
import { createSTTService, type STTService } from '@/services/stt'
import type { Message } from '@/types'

interface VoiceOverlayProps {
  messages: Message[]
  onSend: (text: string) => Promise<void>
  isReviewDetected: boolean
  onClose: () => void
  onEndSession: () => void
}

export function VoiceOverlay({
  messages,
  onSend,
  isReviewDetected,
  onClose,
  onEndSession,
}: VoiceOverlayProps) {
  const { state, transition, reset } = useVoiceStateMachine()
  const { sttProvider } = useVoiceSettings()
  const ttsRef = useRef(new TTSService())
  const sttRef = useRef<STTService | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fallbackInput, setFallbackInput] = useState('')

  // Get the last assistant message as the current question
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')

  // When review is detected externally, transition to done
  useEffect(() => {
    if (isReviewDetected) transition('REVIEW_DETECTED')
  }, [isReviewDetected, transition])

  // Close overlay when done
  useEffect(() => {
    if (state === 'done') onClose()
  }, [state, onClose])

  // Speak the AI question when entering ai_speaking state
  useEffect(() => {
    if (state !== 'ai_speaking' || !lastAssistantMsg) return
    setCurrentQuestion(lastAssistantMsg.content)
    setInterimText('')
    setError(null)

    ttsRef.current
      .speak(lastAssistantMsg.content)
      .then(() => transition('TTS_ENDED'))
      .catch(() => {
        // TTS failed — show text only, continue
        transition('TTS_ENDED')
      })
  }, [state, lastAssistantMsg, transition])

  // Auto-start: speak the first question on mount
  useEffect(() => {
    if (state === 'idle' && lastAssistantMsg) {
      transition('START_SPEAKING')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicStart = useCallback(() => {
    // Interrupt TTS if playing
    ttsRef.current.stop()

    const stt = createSTTService(sttProvider)
    sttRef.current = stt
    stt.onInterim(setInterimText)

    try {
      stt.start()
      transition('MIC_STARTED')
    } catch {
      setError('Could not access microphone. Please check permissions.')
    }
  }, [sttProvider, transition])

  const handleMicStop = useCallback(async () => {
    if (!sttRef.current) return
    transition('MIC_STOPPED')

    const transcript = await sttRef.current.stop()
    sttRef.current = null

    if (!transcript.trim()) {
      // Nothing captured — go back to waiting
      reset()
      transition('START_SPEAKING')
      return
    }

    setInterimText(transcript)
    await onSend(transcript)
    // After onSend, WizardSection will add the AI response to messages,
    // which triggers the ai_speaking effect above via AI_RESPONDED
  }, [transition, reset, onSend])

  // When a new assistant message arrives while processing, trigger next round
  useEffect(() => {
    if (state === 'processing' && lastAssistantMsg) {
      transition('AI_RESPONDED')
    }
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndSession = useCallback(() => {
    ttsRef.current.stop()
    sttRef.current?.stop()
    onEndSession()
  }, [onEndSession])

  const handleSkipToText = useCallback(() => {
    ttsRef.current.stop()
    sttRef.current?.stop()
    onClose()
  }, [onClose])

  const handleFallbackSend = useCallback(async () => {
    if (!fallbackInput.trim()) return
    setError(null)
    transition('MIC_STOPPED')
    setInterimText(fallbackInput)
    await onSend(fallbackInput.trim())
    setFallbackInput('')
  }, [fallbackInput, transition, onSend])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-brand-border bg-brand-bg p-8 shadow-xl">
        {/* Header */}
        <h2 className="font-heading text-xl font-semibold text-brand-text">Voice Mode</h2>

        {/* Current question */}
        <div className="w-full rounded-xl border border-brand-border bg-white p-4">
          <p className="text-center font-body text-brand-text">
            {currentQuestion || 'Starting...'}
          </p>
          {state === 'ai_speaking' && (
            <div className="mt-2 flex justify-center">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-accent-coral" />
              <span className="mx-1 inline-block h-2 w-2 animate-pulse rounded-full bg-brand-accent-coral delay-75" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-accent-coral delay-150" />
            </div>
          )}
        </div>

        {/* Live transcription */}
        {(state === 'user_speaking' || state === 'processing') && interimText && (
          <div className="w-full rounded-xl border border-dashed border-brand-accent-sage bg-white/50 p-4">
            <p className="text-sm text-brand-text-muted italic">
              {interimText}
            </p>
          </div>
        )}

        {/* Error with fallback input */}
        {error && (
          <div className="w-full space-y-2">
            <p className="text-center text-sm text-red-600">{error}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fallbackInput}
                onChange={(e) => setFallbackInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFallbackSend()}
                className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
                placeholder="Type your answer instead..."
              />
              <button
                onClick={handleFallbackSend}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm text-white"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={state === 'user_speaking' ? handleMicStop : handleMicStart}
          disabled={state === 'ai_speaking' || state === 'processing' || state === 'idle'}
          className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all ${
            state === 'user_speaking'
              ? 'animate-pulse bg-red-500 hover:bg-red-600'
              : state === 'waiting_for_user'
                ? 'bg-brand-accent-coral hover:bg-brand-accent-coral/90'
                : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {state === 'user_speaking' ? (
            <StopIcon />
          ) : state === 'processing' ? (
            <SpinnerIcon />
          ) : (
            <MicIcon />
          )}
        </button>

        {/* State label */}
        <p className="text-sm text-brand-text-muted">
          {state === 'idle' && 'Starting...'}
          {state === 'ai_speaking' && 'Listening to question...'}
          {state === 'waiting_for_user' && 'Tap to answer'}
          {state === 'user_speaking' && 'Listening... tap to stop'}
          {state === 'processing' && 'Thinking...'}
        </p>

        {/* Footer buttons */}
        <div className="flex w-full gap-3">
          <button
            onClick={handleEndSession}
            className="flex-1 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm text-brand-text hover:bg-gray-50"
          >
            End Session
          </button>
          <button
            onClick={handleSkipToText}
            className="flex-1 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm text-brand-text hover:bg-gray-50"
          >
            Skip to Text
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Icons ---

function MicIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
```

**Step 2: Verify types**

Run: `npx tsc -b`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/voice/VoiceOverlay.tsx
git commit -m "feat(voice): add VoiceOverlay component with state machine orchestration"
```

---

## Task 8: Integrate Voice Mode into WizardSection

**Files:**
- Modify: `src/pages/WizardSection.tsx`
- Modify: `src/components/chat/ChatWindow.tsx`

**Step 1: Add voice state and overlay to WizardSection**

In `src/pages/WizardSection.tsx`, add:

1. Import VoiceOverlay and useVoiceSettings at top:
```typescript
import { VoiceOverlay } from '@/components/voice/VoiceOverlay'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
```

2. Add state for voice mode (near existing mode state):
```typescript
const [voiceActive, setVoiceActive] = useState(false)
const { voiceEnabled } = useVoiceSettings()
```

3. Add review detection flag (near the response handling in handleSend):
```typescript
const [isReviewDetected, setIsReviewDetected] = useState(false)
```

In the existing response handling where `parseSectionReview()` is called, also set `setIsReviewDetected(true)`.

4. Add handlers:
```typescript
const handleEndVoiceSession = useCallback(async () => {
  await handleSend('Please wrap up and generate a section review based on what we have discussed so far.')
}, [handleSend])
```

5. Render VoiceOverlay when active (add before the return's closing fragment):
```typescript
{voiceActive && (
  <VoiceOverlay
    messages={messages}
    onSend={handleSend}
    isReviewDetected={isReviewDetected}
    onClose={() => setVoiceActive(false)}
    onEndSession={handleEndVoiceSession}
  />
)}
```

6. Pass `voiceEnabled` and `onVoiceStart` to ChatWindow:
```typescript
<ChatWindow
  messages={messages}
  streamingContent={streamingContent}
  onSend={handleSend}
  isStreaming={isStreaming}
  showVoiceButton={voiceEnabled && mode !== 'review'}
  onVoiceStart={() => setVoiceActive(true)}
/>
```

**Step 2: Add voice button to ChatWindow**

In `src/components/chat/ChatWindow.tsx`, update the props interface:

```typescript
interface ChatWindowProps {
  messages: Message[]
  streamingContent: string | null
  onSend: (message: string) => void
  isStreaming: boolean
  showVoiceButton?: boolean
  onVoiceStart?: () => void
}
```

Add a header bar above the messages area:

```typescript
{showVoiceButton && onVoiceStart && (
  <div className="flex items-center justify-end border-b border-brand-border px-4 py-2">
    <button
      onClick={onVoiceStart}
      className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-gray-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
      </svg>
      Voice
    </button>
  </div>
)}
```

**Step 3: Verify types and build**

Run: `npx tsc -b`
Expected: PASS

**Step 4: Manual test**

Run: `npm run dev`
- Navigate to a section
- Verify Voice button appears in chat header
- Click it — overlay should open
- Verify End Session and Skip to Text close the overlay

**Step 5: Commit**

```bash
git add src/pages/WizardSection.tsx src/components/chat/ChatWindow.tsx
git commit -m "feat(voice): integrate VoiceOverlay into WizardSection and ChatWindow"
```

---

## Task 9: Silence Detection

**Files:**
- Modify: `src/services/stt.ts` (add silence detection to BrowserSTTService)

**Step 1: Add silence timeout logic to BrowserSTTService**

In the `start()` method, after setting up `onresult`, add a silence timer that resets on each result event:

```typescript
private silenceTimer: ReturnType<typeof setTimeout> | null = null
private onSilence: (() => void) | null = null

onSilenceDetected(cb: () => void): void {
  this.onSilence = cb
}
```

In `onresult` handler, reset the timer:
```typescript
// Reset silence timer on any speech input
if (this.silenceTimer) clearTimeout(this.silenceTimer)
this.silenceTimer = setTimeout(() => {
  this.onSilence?.()
}, 3000) // 3 seconds of silence
```

In `stop()`, clear the timer:
```typescript
if (this.silenceTimer) clearTimeout(this.silenceTimer)
```

**Step 2: Use silence detection in VoiceOverlay**

In `handleMicStart`, after `stt.start()`:
```typescript
if ('onSilenceDetected' in stt) {
  (stt as BrowserSTTService).onSilenceDetected(() => {
    // Auto-stop after silence — user confirms before sending
    handleMicStop()
  })
}
```

**Step 3: Verify types**

Run: `npx tsc -b`
Expected: PASS

**Step 4: Commit**

```bash
git add src/services/stt.ts src/components/voice/VoiceOverlay.tsx
git commit -m "feat(voice): add 3-second silence detection to auto-stop recording"
```

---

## Task 10: Environment Variables and Deployment Config

**Files:**
- Modify: `vercel.json` (add API routes for tts and stt)

**Step 1: Check if vercel.json needs route additions**

Read `vercel.json`. The existing rewrites should already handle `/api/*` routes since `api/tts.ts` and `api/stt.ts` follow the same convention as `api/chat.ts`. Verify this is the case.

If rewrites are explicit (not wildcard), add:
```json
{ "source": "/api/tts", "destination": "/api/tts" },
{ "source": "/api/stt", "destination": "/api/stt" }
```

**Step 2: Document required env vars**

Add to the project README or CLAUDE.md under env vars:
```
- `ELEVENLABS_API_KEY` — server-side, for TTS proxy
- `ELEVENLABS_VOICE_ID` — voice selection (e.g., 'EXAVITQu4vr4xnSDxMaL')
- `STT_PROVIDER_API_KEY` — server-side, OpenAI API key for Whisper (optional, only if cloud STT enabled)
```

**Step 3: Commit**

```bash
git add vercel.json CLAUDE.md
git commit -m "feat(voice): add deployment config and env var documentation"
```

---

## Task 11: End-to-End Manual Test

**No files changed — verification only.**

**Step 1: Set up env vars locally**

Create/update `.env.local`:
```
ELEVENLABS_API_KEY=<your-key>
ELEVENLABS_VOICE_ID=<your-voice-id>
STT_PROVIDER_API_KEY=<your-openai-key>  # optional
```

**Step 2: Start dev server**

Run: `npm run dev`

**Step 3: Test the full flow**

1. Navigate to Brand Basics section
2. Verify Voice button appears in chat header
3. Click Voice — overlay opens
4. AI question should appear as text and play via TTS
5. After TTS finishes, mic button becomes active (coral color)
6. Click mic, speak an answer, verify live transcription
7. Click stop (or wait for silence detection)
8. Verify transcript appears as a user message in conversation store
9. AI responds and speaks the next question
10. Test "Skip to Text" — overlay closes, chat shows full conversation
11. Re-enter voice mode, test "End Session" — should trigger review
12. Verify SectionReview component shows with the gathered data

**Step 4: Test error cases**

1. Deny microphone permission — verify toast and fallback
2. Disconnect network during TTS — verify question still shows as text
3. Test in Firefox — verify cloud STT auto-fallback works

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests pass, new tests pass

**Step 6: Type check and build**

Run: `npx tsc -b && npm run build`
Expected: Clean build with no errors

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat(voice): complete voice mode implementation"
```
