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
