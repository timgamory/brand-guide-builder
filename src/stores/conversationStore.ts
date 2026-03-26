import { create } from 'zustand'
import type { Message } from '../types'
import { getConversation, saveConversation } from '../services/storage'

type ConversationState = {
  messages: Message[]
  isStreaming: boolean
  currentSessionId: string | null
  currentSectionId: string | null
  loadConversation: (sessionId: string, sectionId: string) => Promise<void>
  addMessage: (message: Message) => Promise<void>
  setStreaming: (streaming: boolean) => void
  clearConversation: () => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentSessionId: null,
  currentSectionId: null,

  loadConversation: async (sessionId, sectionId) => {
    const convo = await getConversation(sessionId, sectionId)
    set({
      messages: convo?.messages ?? [],
      currentSessionId: sessionId,
      currentSectionId: sectionId,
    })
  },

  addMessage: async (message) => {
    const { messages, currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    const updated = [...messages, message]
    set({ messages: updated })
    await saveConversation(currentSessionId, currentSectionId, { messages: updated })
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearConversation: async () => {
    const { currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    set({ messages: [] })
    await saveConversation(currentSessionId, currentSectionId, { messages: [] })
  },
}))
