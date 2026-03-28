import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message } from '@/types'
import { useVoiceStateMachine } from '@/hooks/useVoiceStateMachine'
import type { VoiceState } from '@/hooks/useVoiceStateMachine'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import { TTSService } from '@/services/tts'
import { createSTTService, BrowserSTTService, type STTService } from '@/services/stt'

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

  const ttsRef = useRef<TTSService>(new TTSService())
  const sttRef = useRef<STTService | null>(null)

  const [currentQuestion, setCurrentQuestion] = useState('')
  const [interimText, setInterimText] = useState('')
  const [sttError, setSttError] = useState<string | null>(null)
  const [fallbackInput, setFallbackInput] = useState('')
  const handleMicPressRef = useRef<() => void>(() => {})

  // Track the message count so we can detect new assistant messages
  const prevMessageCountRef = useRef(messages.length)

  // Helper: get last assistant message content
  const getLastAssistantMessage = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content
      }
    }
    return null
  }, [messages])

  // 1. Auto-start on mount: idle + last assistant message -> START_SPEAKING
  useEffect(() => {
    if (state === 'idle') {
      const text = getLastAssistantMessage()
      if (text) {
        transition('START_SPEAKING')
      }
    }
  }, [state, getLastAssistantMessage, transition])

  // 2. ai_speaking: speak the last assistant message via TTS
  useEffect(() => {
    if (state !== 'ai_speaking') return

    const text = getLastAssistantMessage()
    if (!text) {
      transition('TTS_ENDED')
      return
    }

    setCurrentQuestion(text)

    let cancelled = false
    ttsRef.current
      .speak(text)
      .then(() => {
        if (!cancelled) transition('TTS_ENDED')
      })
      .catch(() => {
        if (!cancelled) transition('TTS_ENDED')
      })

    return () => {
      cancelled = true
    }
  }, [state, getLastAssistantMessage, transition])

  // 5. processing -> ai_speaking: detect new assistant message
  useEffect(() => {
    if (state === 'processing' && messages.length > prevMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant') {
        transition('AI_RESPONDED')
      }
    }
    prevMessageCountRef.current = messages.length
  }, [state, messages, transition])

  // 6. Review detection
  useEffect(() => {
    if (isReviewDetected && state === 'processing') {
      transition('REVIEW_DETECTED')
    }
  }, [isReviewDetected, state, transition])

  // When state becomes done, close the overlay
  useEffect(() => {
    if (state === 'done') {
      onClose()
    }
  }, [state, onClose])

  // Cleanup on unmount: stop TTS and STT
  useEffect(() => {
    const tts = ttsRef.current
    return () => {
      tts.stop()
      if (sttRef.current?.isListening()) {
        sttRef.current.stop().catch(() => {})
      }
    }
  }, [])

  // Handle mic button tap
  const handleMicPress = useCallback(async () => {
    // 7. TTS interrupt: user taps mic during ai_speaking
    if (state === 'ai_speaking') {
      ttsRef.current.stop()
      // Start STT immediately
      setSttError(null)
      setInterimText('')
      try {
        const stt = createSTTService(sttProvider)
        sttRef.current = stt
        stt.onInterim((text) => setInterimText(text))
        if ('onSilenceDetected' in stt) {
          (stt as BrowserSTTService).onSilenceDetected(() => {
            handleMicPressRef.current()
          })
        }
        stt.start()
        transition('MIC_STARTED')
      } catch (err) {
        setSttError(err instanceof Error ? err.message : 'Failed to start microphone')
      }
      return
    }

    // 3. waiting_for_user -> user_speaking
    if (state === 'waiting_for_user') {
      setSttError(null)
      setInterimText('')
      try {
        const stt = createSTTService(sttProvider)
        sttRef.current = stt
        stt.onInterim((text) => setInterimText(text))
        if ('onSilenceDetected' in stt) {
          (stt as BrowserSTTService).onSilenceDetected(() => {
            handleMicPressRef.current()
          })
        }
        stt.start()
        transition('MIC_STARTED')
      } catch (err) {
        setSttError(err instanceof Error ? err.message : 'Failed to start microphone')
      }
      return
    }

    // 4. user_speaking -> processing
    if (state === 'user_speaking') {
      try {
        const transcript = sttRef.current ? await sttRef.current.stop() : ''
        transition('MIC_STOPPED')

        if (!transcript.trim()) {
          // Empty transcript: reset back to re-speak
          reset()
          return
        }

        setInterimText(transcript)
        await onSend(transcript)
      } catch (err) {
        setSttError(err instanceof Error ? err.message : 'Transcription failed')
        transition('MIC_STOPPED')
      }
      return
    }
  }, [state, sttProvider, transition, reset, onSend])

  // Keep ref in sync so silence callback always calls the latest version
  handleMicPressRef.current = handleMicPress

  // Fallback text input submit
  const handleFallbackSubmit = useCallback(async () => {
    if (!fallbackInput.trim()) return
    const text = fallbackInput.trim()
    setFallbackInput('')
    setSttError(null)
    transition('MIC_STOPPED')
    await onSend(text)
  }, [fallbackInput, transition, onSend])

  // Determine mic button style/state
  const micConfig = getMicConfig(state)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-brand-border bg-brand-bg p-6 shadow-xl">
        {/* Header */}
        <h2 className="mb-4 text-center font-heading text-xl text-brand-text">
          Voice Mode
        </h2>

        {/* Question card */}
        <div className="mb-4 rounded-xl border border-brand-border bg-brand-bg-warm p-4">
          {state === 'ai_speaking' ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-end gap-1">
                <span className="inline-block h-3 w-1 animate-pulse rounded-full bg-brand-accent-coral [animation-delay:0ms]" />
                <span className="inline-block h-5 w-1 animate-pulse rounded-full bg-brand-accent-coral [animation-delay:100ms]" />
                <span className="inline-block h-7 w-1 animate-pulse rounded-full bg-brand-accent-coral [animation-delay:200ms]" />
                <span className="inline-block h-5 w-1 animate-pulse rounded-full bg-brand-accent-coral [animation-delay:300ms]" />
                <span className="inline-block h-3 w-1 animate-pulse rounded-full bg-brand-accent-coral [animation-delay:400ms]" />
              </div>
              <p className="font-body text-body-sm text-brand-text-muted">Listening...</p>
            </div>
          ) : (
            <p className="font-body text-body text-brand-text">
              {currentQuestion || 'Waiting for assistant...'}
            </p>
          )}
        </div>

        {/* Live transcription */}
        {(state === 'user_speaking' || state === 'processing') && interimText && (
          <div className="mb-4 rounded-lg border border-brand-accent-sage bg-brand-bg p-3">
            <p className="font-body text-body-sm text-brand-text-secondary italic">
              {interimText}
            </p>
          </div>
        )}

        {/* Error + fallback input */}
        {sttError && (
          <div className="mb-4 space-y-2">
            <p className="text-center font-body text-body-sm text-red-600">
              {sttError}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fallbackInput}
                onChange={(e) => setFallbackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFallbackSubmit()
                }}
                placeholder="Type your response instead..."
                className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 font-body text-body-sm text-brand-text placeholder:text-brand-text-faint focus:border-brand-accent-coral focus:outline-none"
              />
              <button
                onClick={handleFallbackSubmit}
                className="rounded-lg bg-brand-accent-coral px-4 py-2 font-body text-body-sm font-medium text-white hover:opacity-90"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Mic button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={handleMicPress}
            disabled={micConfig.disabled}
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${micConfig.className}`}
            aria-label={micConfig.label}
          >
            {micConfig.icon}
          </button>
        </div>

        {/* State label */}
        <p className="mb-4 text-center font-body text-body-sm text-brand-text-muted">
          {getStateLabel(state)}
        </p>

        {/* Footer */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              ttsRef.current.stop()
              if (sttRef.current) { sttRef.current.stop(); sttRef.current = null }
              onClose()
              onEndSession()
            }}
            className="rounded-lg border border-brand-border px-6 py-2 font-body text-body-sm text-brand-text-secondary hover:bg-brand-bg-warm"
          >
            I'm Done
          </button>
        </div>
      </div>
    </div>
  )
}

// === Helpers ===

function getStateLabel(state: VoiceState): string {
  switch (state) {
    case 'idle':
      return 'Initializing...'
    case 'ai_speaking':
      return 'AI is speaking...'
    case 'waiting_for_user':
      return 'Tap the mic to respond'
    case 'user_speaking':
      return 'Listening... tap to stop'
    case 'processing':
      return 'Processing your response...'
    case 'done':
      return 'Session complete'
  }
}

function getMicConfig(state: VoiceState): {
  className: string
  icon: React.ReactElement
  disabled: boolean
  label: string
} {
  switch (state) {
    case 'waiting_for_user':
      return {
        className: 'bg-brand-accent-coral text-white hover:opacity-90 shadow-lg',
        icon: <MicIcon />,
        disabled: false,
        label: 'Start recording',
      }
    case 'user_speaking':
      return {
        className: 'bg-red-500 text-white animate-pulse shadow-lg',
        icon: <StopIcon />,
        disabled: false,
        label: 'Stop recording',
      }
    case 'processing':
      return {
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        icon: <SpinnerIcon />,
        disabled: true,
        label: 'Processing',
      }
    case 'ai_speaking':
      return {
        className: 'bg-brand-accent-coral/60 text-white hover:bg-brand-accent-coral hover:opacity-90',
        icon: <MicIcon />,
        disabled: false,
        label: 'Interrupt and speak',
      }
    default:
      return {
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        icon: <MicIcon />,
        disabled: true,
        label: 'Microphone unavailable',
      }
  }
}

// === Inline SVG Icons ===

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      <rect x="9" y="1" width="6" height="14" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-8 w-8"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 animate-spin"
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
