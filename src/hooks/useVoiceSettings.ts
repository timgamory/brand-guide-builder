import { useState, useCallback } from 'react'

type SttProvider = 'browser' | 'cloud'

export function useVoiceSettings() {
  const [voiceEnabled, setVoiceEnabledState] = useState(
    () => {
      const v = localStorage.getItem('voiceEnabled')
      return v === null ? true : v === 'true'
    }
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
