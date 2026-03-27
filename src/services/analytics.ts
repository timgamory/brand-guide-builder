import { supabase } from './supabase'
import { useBrandGuideStore } from '../stores/brandGuideStore'

export function track(
  eventType: string,
  payload: Record<string, unknown>,
  sessionId?: string,
): void {
  try {
    const resolvedSessionId = sessionId ?? useBrandGuideStore.getState().session?.id
    supabase.from('analytics_events').insert({
      session_id: resolvedSessionId ?? null,
      event_type: eventType,
      payload,
    }).then(
      () => {},  // resolve: ignore
      () => {},  // reject: swallow
    )
  } catch {
    // Never let analytics break the app
  }
}
