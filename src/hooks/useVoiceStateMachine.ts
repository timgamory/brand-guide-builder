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
