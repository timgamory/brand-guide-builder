import { create } from 'zustand'
import type { ReflectionEntry } from '../types'
import { getReflections, saveReflection } from '../services/storage'

type ReflectionState = {
  entries: Record<string, string>  // sectionId -> text
  currentSessionId: string | null
  loadReflections: (sessionId: string) => Promise<void>
  setReflection: (sectionId: string, text: string) => Promise<void>
  getReflection: (sectionId: string) => string
}

export const useReflectionStore = create<ReflectionState>((set, get) => ({
  entries: {},
  currentSessionId: null,

  loadReflections: async (sessionId) => {
    const reflections = await getReflections(sessionId)
    const entries: Record<string, string> = {}
    if (reflections) {
      for (const e of reflections.entries) {
        entries[e.sectionId] = e.text
      }
    }
    set({ entries, currentSessionId: sessionId })
  },

  setReflection: async (sectionId, text) => {
    const { currentSessionId, entries } = get()
    if (!currentSessionId) return
    await saveReflection(currentSessionId, sectionId, text)
    set({ entries: { ...entries, [sectionId]: text } })
  },

  getReflection: (sectionId) => {
    return get().entries[sectionId] ?? ''
  },
}))
