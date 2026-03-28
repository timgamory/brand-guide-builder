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
